'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useAppContext } from '@/context/app-context';
import { format, subMonths, startOfMonth } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function SpendingBarChart() {
  const { state } = useAppContext();
  const { expenses } = state;

  const chartData = React.useMemo(() => {
    const dataByMonth: { [key: string]: number } = {};
    const today = new Date();

    // Initialize the last 6 months with 0 spending
    for (let i = 5; i >= 0; i--) {
        const month = startOfMonth(subMonths(today, i));
        const monthKey = format(month, 'MMM yyyy');
        dataByMonth[monthKey] = 0;
    }

    // Populate with actual expense data
    (expenses || []).forEach(expense => {
        let expenseDate;
        if (expense.date instanceof Timestamp) {
            expenseDate = expense.date.toDate();
        } else {
            expenseDate = new Date(expense.date as any);
        }

        const monthKey = format(startOfMonth(expenseDate), 'MMM yyyy');
        if (dataByMonth.hasOwnProperty(monthKey)) {
            dataByMonth[monthKey] += expense.amount;
        }
    });

    return Object.entries(dataByMonth).map(([month, total]) => ({
      month: month.split(' ')[0], // just the month name
      total,
    }));
  }, [expenses]);
  
  const chartConfig = {
    total: {
      label: 'Total Spending',
      color: 'hsl(var(--chart-1))',
    },
  };
  
  if (chartData.every(d => d.total === 0)) {
    return (
      <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-lg border">
        <p className="text-muted-foreground">Not enough data for monthly trends.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(value) => `Rs.${value}`}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
