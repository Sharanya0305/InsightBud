'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, isSameMonth, isBefore, format, subMonths } from 'date-fns';
import { Banknote, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { type WithId, type Expense, type Rollover } from '@/lib/types';


type SurplusMonth = {
    month: Date;
    monthKey: string;
    surplus: number;
}

const getJSDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    try {
        const d = new Date(date);
        if (!isNaN(d.getTime())) return d;
    } catch (e) {
        return null;
    }
    return null;
}

const getEarliestDate = (expenses: WithId<Expense>[], budget: any): Date => {
    const budgetCreationDate = budget?.createdAt ? getJSDate(budget.createdAt) : null;

    if (!expenses || expenses.length === 0) {
        return budgetCreationDate || new Date();
    }
    
    const firstExpenseDate = expenses.reduce((earliest, current) => {
        const currentDate = getJSDate(current.date);
        if (!currentDate) return earliest;

        const earliestDate = getJSDate(earliest.date);
        if (!earliestDate) return current;

        return currentDate < earliestDate ? current : earliest;
    }).date;

    const earliestExpenseJSDate = getJSDate(firstExpenseDate);

    if (budgetCreationDate && earliestExpenseJSDate) {
        return budgetCreationDate < earliestExpenseJSDate ? budgetCreationDate : earliestExpenseJSDate;
    }
    
    return earliestExpenseJSDate || budgetCreationDate || new Date();
}


export function BudgetRollover() {
  const { state, addContribution, addRollover } = useAppContext();
  const { savingsGoals, expenses, budget, rollovers, loading } = state;
  const { toast } = useToast();
  const router = useRouter();

  const [selectedGoalId, setSelectedGoalId] = React.useState<string | undefined>(undefined);
  const [surplusMonths, setSurplusMonths] = React.useState<SurplusMonth[]>([]);
  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string | undefined>(undefined);
  
  const activeSavingsGoals = React.useMemo(() => {
    return (savingsGoals || []).filter(g => g.currentAmount < g.targetAmount);
  }, [savingsGoals]);


  React.useEffect(() => {
    if (loading.expenses || loading.budget || loading.rollovers || !budget?.amount || !expenses) {
        return;
    }

    const rolloversByMonth = (rollovers || []).reduce((acc, rollover) => {
        acc[rollover.month] = (acc[rollover.month] || 0) + rollover.transferredAmount;
        return acc;
    }, {} as Record<string, number>);

    const firstDate = getEarliestDate(expenses, budget);
    const firstMonth = startOfMonth(firstDate);
    const currentMonth = startOfMonth(new Date());
    const monthSet = new Set<string>();

    let monthIterator = firstMonth;
    while(isBefore(monthIterator, currentMonth) || isSameMonth(monthIterator, currentMonth)) {
        if (isBefore(monthIterator, currentMonth)) { // Only add past months
             monthSet.add(format(monthIterator, 'yyyy-MM'));
        }
        monthIterator = subMonths(monthIterator, -1);
    }

    const calculatedSurplusMonths = Array.from(monthSet)
      .map(monthKey => {
        const month = new Date(monthKey + '-01T12:00:00');
        
        const monthExpenses = (expenses || []).filter((expense) => {
          const expenseDate = getJSDate(expense.date);
          return expenseDate && isSameMonth(expenseDate, month);
        });

        const totalSpent = monthExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        const initialSurplus = budget.amount > totalSpent ? budget.amount - totalSpent : 0;
        
        const alreadyTransferred = rolloversByMonth[monthKey] || 0;
        const remainingSurplus = initialSurplus - alreadyTransferred;

        return { month, monthKey, surplus: remainingSurplus };
      })
      .filter(item => item.surplus > 0.01) // Only include months with a meaningful positive surplus
      .sort((a, b) => b.month.getTime() - a.month.getTime());

    setSurplusMonths(calculatedSurplusMonths);

    // If there's no selection or the current selection is no longer valid, set a new default
    const currentSelectionIsValid = calculatedSurplusMonths.some(m => m.monthKey === selectedMonthKey);
    if (calculatedSurplusMonths.length > 0 && !currentSelectionIsValid) {
      setSelectedMonthKey(calculatedSurplusMonths[0].monthKey);
    } else if (calculatedSurplusMonths.length === 0) {
      setSelectedMonthKey(undefined);
    }

  }, [loading.expenses, loading.budget, loading.rollovers, expenses, budget, rollovers]);


  React.useEffect(() => {
    if (!selectedGoalId && activeSavingsGoals.length > 0) {
        setSelectedGoalId(activeSavingsGoals[0].id);
    }
  }, [activeSavingsGoals, selectedGoalId]);


  const handleTransfer = () => {
    const currentSurplusItem = surplusMonths.find(m => m.monthKey === selectedMonthKey);

    if (!selectedGoalId || !currentSurplusItem || currentSurplusItem.surplus <= 0) {
        toast({
            variant: 'destructive',
            title: "Transfer Failed",
            description: "Please select a valid savings goal and a month with a surplus."
        });
      return;
    }
    
    const goal = savingsGoals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    const amountNeeded = goal.targetAmount - goal.currentAmount;
    if (amountNeeded <= 0) {
      toast({ title: 'Goal Already Met!', description: `Your "${goal.name}" goal is complete.` });
      return;
    }

    const transferAmount = Math.min(currentSurplusItem.surplus, amountNeeded);
    
    // 1. Add contribution to the savings goal
    addContribution(selectedGoalId, transferAmount);
    
    // 2. Persist a new, unique rollover record for this specific transfer
    addRollover({
        month: currentSurplusItem.monthKey,
        transferredAmount: transferAmount,
        transferredToGoalId: selectedGoalId
    });

    toast({
      title: 'Funds Transferred!',
      description: `Rs.${transferAmount.toFixed(2)} has been successfully transferred to your "${goal.name}" goal.`,
    });
    
    const isCompleted = (goal.currentAmount + transferAmount) >= goal.targetAmount;
    if (isCompleted) {
        toast({ title: 'Goal Achieved!', description: `Redirecting to your savings goals...` });
        router.push('/dashboard/savings');
    }
  };
  
  const currentSurplusItem = surplusMonths.find(m => m.monthKey === selectedMonthKey);

  if (loading.expenses || loading.budget || loading.rollovers) {
    return <Skeleton className="h-[250px] w-full" />
  }

  if (surplusMonths.length === 0) {
    return (
        <Card className="bg-gradient-to-r from-background to-card/50 border-primary/20 shadow-lg">
             <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Budget Rollover</CardTitle>
                    </div>
                </div>
              </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-4">
                    No rollover surplus available from previous months.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-background to-card/50 border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Budget Rollover</CardTitle>
                    <CardDescription>
                        You had a surplus in a previous month. Put that money to work!
                    </CardDescription>
                </div>
            </div>
             <Select
                value={selectedMonthKey}
                onValueChange={setSelectedMonthKey}
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                {surplusMonths.map((item) => (
                    <SelectItem key={item.monthKey} value={item.monthKey}>
                    {format(item.month, 'MMMM yyyy')}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      
      {currentSurplusItem ? (
        <>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                Available Surplus from {format(currentSurplusItem.month, 'MMMM yyyy')}
                </p>
                <p className="text-4xl font-bold tracking-tight text-primary">
                Rs.{currentSurplusItem.surplus.toFixed(2)}
                </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-4">
               {activeSavingsGoals.length > 0 ? (
                 <>
                    <div className="flex-1 w-full sm:w-auto">
                        <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a savings goal" />
                        </SelectTrigger>
                        <SelectContent>
                            {activeSavingsGoals.map((goal) => (
                                <SelectItem key={goal.id} value={goal.id}>
                                    {goal.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleTransfer} disabled={!selectedGoalId} className="w-full sm:w-auto">
                        <Banknote className="mr-2" />
                        Transfer to Savings
                    </Button>
                 </>
               ) : (
                 <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Create a new savings goal to transfer your surplus.
                    </p>
                    <Button onClick={() => router.push('/dashboard/savings')}>Create Goal</Button>
                 </div>
               )}
            </CardFooter>
        </>
      ) : (
         <CardContent>
            <p className="text-center text-muted-foreground py-8">
              No remaining surplus available for the selected month.
            </p>
        </CardContent>
      )}

    </Card>
  );
}
