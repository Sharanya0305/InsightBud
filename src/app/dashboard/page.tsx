'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';
import { SpendingBarChart } from '@/components/dashboard/spending-bar-chart';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SavingsGoalProgress } from '@/components/dashboard/savings-goal-progress';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { isThisMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { SpendingInsights } from '@/components/dashboard/spending-insights';
import { FinanceChatbot } from '@/components/dashboard/finance-chatbot';

export default function DashboardPage() {
  const { state } = useAppContext();
  const { toast } = useToast();
  const { budget, expenses, loading } = state;
  const budgetAlertShown = React.useRef(false);

  React.useEffect(() => {
    if (budget && budget.amount > 0 && expenses) {
      const thisMonthExpenses = expenses.filter((expense) =>
        isThisMonth(new Date(expense.date))
      );
      const totalSpentThisMonth = thisMonthExpenses.reduce((acc, expense) => acc + expense.amount, 0);
      const spendingPercentage = (totalSpentThisMonth / budget.amount) * 100;

      if (spendingPercentage >= 80 && spendingPercentage < 100 && !budgetAlertShown.current) {
        toast({
          title: 'Budget Alert',
          description: `You've spent ${spendingPercentage.toFixed(0)}% of your monthly budget.`,
        });
        budgetAlertShown.current = true;
      } else if (spendingPercentage < 80) {
        budgetAlertShown.current = false;
      }
    }
  }, [expenses, budget, toast]);


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Here's a snapshot of your finances."
      />
      {loading.expenses || loading.budget || loading.categories ? <KpiSkeleton /> : <KpiCards />}
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <SpendingInsights />
        </div>
        <div className="lg:col-span-3">
            <FinanceChatbot />
        </div>
         <div className="lg:col-span-2">
           {loading.expenses || loading.categories ? <RecentTransactionsSkeleton /> : <RecentTransactions />}
         </div>
          <div className="flex flex-col gap-6 lg:col-span-1">
              {loading.budget || loading.expenses ? <Skeleton className="h-[200px]" /> : <BudgetProgress />}
              {loading.savingsGoals ? <Skeleton className="h-[200px]" /> : <SavingsGoalProgress />}
          </div>
      </div>
      
    </div>
  );
}

const KpiSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
    </div>
);

const RecentTransactionsSkeleton = () => (
    <Card>
        <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your 5 most recent expenses.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </CardContent>
    </Card>
);
