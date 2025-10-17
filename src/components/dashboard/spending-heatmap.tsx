'use client';

import * as React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip as ReactTooltip } from 'react-tooltip'
import 'react-calendar-heatmap/dist/styles.css';
import { subYears, format, startOfDay } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Timestamp } from 'firebase/firestore';

export function SpendingHeatmap() {
  const { state } = useAppContext();
  const { expenses, loading } = state;

  const heatmapData = React.useMemo(() => {
    if (!expenses) return [];
    
    const dailyTotals = expenses.reduce((acc, expense) => {
        const expenseDate = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
        const dateKey = format(startOfDay(expenseDate), 'yyyy-MM-dd');
        acc[dateKey] = (acc[dateKey] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyTotals).map(([date, count]) => ({
      date: date,
      count: count,
    }));
  }, [expenses]);
  
  const today = new Date();
  const oneYearAgo = subYears(today, 1);
  
  if (loading.expenses) {
      return <Skeleton className="h-[260px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spending Heatmap</CardTitle>
        <CardDescription>A calendar view of your spending over the last year.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div style={{minWidth: '700px'}}>
            <CalendarHeatmap
                startDate={oneYearAgo}
                endDate={today}
                values={heatmapData}
                classForValue={(value) => {
                    if (!value) {
                    return 'color-empty';
                    }
                    // Adjust the scale as needed
                    if (value.count < 100) return 'color-scale-1';
                    if (value.count < 500) return 'color-scale-2';
                    if (value.count < 1000) return 'color-scale-3';
                    return 'color-scale-4';
                }}
                tooltipDataAttrs={(value: any) => {
                    const amount = value.count ? `Rs.${value.count.toFixed(2)}` : 'No spending';
                    return {
                        'data-tooltip-id': 'heatmap-tooltip',
                        'data-tooltip-content': `${value.date ? format(new Date(value.date), 'PPP') : 'No Date'}: ${amount}`,
                    };
                }}
                showWeekdayLabels={true}
            />
        </div>
        <ReactTooltip id="heatmap-tooltip" />
      </CardContent>
    </Card>
  );
}
