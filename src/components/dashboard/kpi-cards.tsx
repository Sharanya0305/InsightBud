'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import { isThisMonth } from 'date-fns';
import { DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export function KpiCards() {
  const { state } = useAppContext();
  const { expenses, budget, categories } = state;

  const thisMonthExpenses = (expenses || []).filter((expense) => {
    const expenseDate = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
    return isThisMonth(expenseDate);
  });

  const totalSpentThisMonth = thisMonthExpenses.reduce(
    (acc, expense) => acc + expense.amount,
    0
  );

  const budgetAmount = budget?.amount || 0;
  const remainingBudget = budgetAmount - totalSpentThisMonth;

  const categorySpending = thisMonthExpenses.reduce((acc, expense) => {
    acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const biggestCategoryId = Object.entries(categorySpending).reduce(
    (max, entry) => (entry[1] > max[1] ? entry : max),
    ['', 0]
  )[0];
  
  const biggestCategory = (categories || []).find(c => c.id === biggestCategoryId)?.name;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Spent This Month
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Rs.{totalSpentThisMonth.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              remainingBudget < 0 ? 'text-destructive' : ''
            }`}
          >
            Rs.{remainingBudget.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            From your Rs.{budgetAmount.toFixed(2)} budget
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Highest Spending Category
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {biggestCategory || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            This month's biggest expense area
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
