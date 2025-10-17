'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppContext } from '@/context/app-context';
import { isThisMonth } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function BudgetProgress() {
  const { state } = useAppContext();
  const { expenses, budget } = state;

  const thisMonthExpenses = (expenses || []).filter((expense) => {
    const expenseDate = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
    return isThisMonth(expenseDate);
  });

  const totalSpentThisMonth = thisMonthExpenses.reduce(
    (acc, expense) => acc + expense.amount,
    0
  );

  const budgetAmount = budget?.amount || 0;
  const progress = budgetAmount > 0 ? (totalSpentThisMonth / budgetAmount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>Your spending vs. your budget.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Rs.{totalSpentThisMonth.toFixed(2)}</span>
          <span className="text-muted-foreground">
            of Rs.{budgetAmount.toFixed(2)}
          </span>
        </div>
        <Progress value={progress} />
        {progress > 100 && (
          <p className="text-sm text-destructive">
            You've exceeded your budget by Rs.
            {(totalSpentThisMonth - budgetAmount).toFixed(2)}
          </p>
        )}
         {progress >= 80 && progress <= 100 && (
          <p className="text-sm text-orange-500">
            You are nearing your budget limit.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
