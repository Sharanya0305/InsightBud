'use client';

import * as React from 'react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { detectRecurringExpenses } from '@/ai/flows/recurring-expense-detector';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export function RecurringExpenseDetector() {
  const { state, updateExpense } = useAppContext();
  const { expenses, loading } = state;
  const { toast } = useToast();

  const [suggestedIds, setSuggestedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const hasBeenDismissed = React.useRef(false);

  React.useEffect(() => {
    if (loading.expenses || expenses.length < 5 || hasBeenDismissed.current) {
      return;
    }

    const runDetection = async () => {
      setIsLoading(true);
      try {
        const nonRecurringExpenses = expenses
            .filter(e => !e.isRecurring)
            .map(e => ({
                ...e,
                date: e.date instanceof Timestamp ? e.date.toDate().toISOString() : new Date(e.date).toISOString()
            }));

        if (nonRecurringExpenses.length < 3) {
            setIsLoading(false);
            return;
        }

        const result = await detectRecurringExpenses({ expenses: nonRecurringExpenses });
        
        // Filter out suggestions for expenses that are already recurring
        const newSuggestions = result.recurringExpenseIds.filter(id => {
            const expense = expenses.find(e => e.id === id);
            return expense && !expense.isRecurring;
        });

        if (newSuggestions.length > 0) {
            setSuggestedIds(newSuggestions);
        }

      } catch (error) {
        console.error('Failed to detect recurring expenses:', error);
        // Don't show a toast for this, as it's a background task.
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the detection to avoid running it too often
    const timeoutId = setTimeout(runDetection, 2000);
    return () => clearTimeout(timeoutId);

  }, [expenses, loading.expenses]);

  const handleConfirm = () => {
    const expensesToUpdate = expenses.filter(e => suggestedIds.includes(e.id));
    
    expensesToUpdate.forEach(expense => {
      updateExpense({ ...expense, isRecurring: true });
    });

    toast({
      title: 'Expenses Updated',
      description: `${expensesToUpdate.length} expense(s) have been marked as recurring.`,
    });
    setSuggestedIds([]);
    hasBeenDismissed.current = true;
  };

  const handleDismiss = () => {
    setSuggestedIds([]);
    hasBeenDismissed.current = true;
  };
  
  const suggestedExpenses = expenses.filter(e => suggestedIds.includes(e.id));

  if (isLoading) {
    return (
        <Alert className="bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is looking for recurring expenses...
            </AlertTitle>
        </Alert>
    )
  }

  if (suggestedIds.length === 0) {
    return null;
  }

  return (
    <Alert className="bg-primary/5 border-primary/20">
      <Sparkles className="h-4 w-4" />
      <AlertTitle>AI Suggestion</AlertTitle>
      <AlertDescription className="mt-2">
        We found {suggestedExpenses.length} transaction(s) that might be a recurring expense: <strong>{suggestedExpenses.map(e => e.title).join(', ')}</strong>.
        <br />
        Would you like to mark them as recurring?
      </AlertDescription>
      <div className="mt-4 flex gap-4">
        <Button size="sm" onClick={handleConfirm}>
          Yes, Mark as Recurring
        </Button>
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          Dismiss
        </Button>
      </div>
    </Alert>
  );
}
