'use client';

import * as React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label, Pie, PieChart } from 'recharts';
import { useAppContext } from '@/context/app-context';
import { format, startOfMonth, isSameMonth } from 'date-fns';
import { CardDescription } from '../ui/card';
import { Timestamp } from 'firebase/firestore';

export function CategoryPieChart() {
  const { state } = useAppContext();
  const { expenses, categories } = state;

  // Generate a list of unique months from expenses
  const availableMonths = React.useMemo(() => {
    const monthSet = new Set<string>();
    (expenses || []).forEach((expense) => {
      const expenseDate = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
      monthSet.add(format(startOfMonth(expenseDate), 'yyyy-MM'));
    });
    // Add current month if not present
    monthSet.add(format(startOfMonth(new Date()), 'yyyy-MM'));
    
    return Array.from(monthSet)
      .map(dateStr => new Date(dateStr + '-01T12:00:00')) // Avoid timezone issues
      .sort((a, b) => b.getTime() - a.getTime());
  }, [expenses]);
  
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(availableMonths[0] || new Date());

  React.useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.find(m => isSameMonth(m, selectedMonth))) {
        setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const chartData = React.useMemo(() => {
    const filteredExpenses = (expenses || []).filter((expense) => {
      const expenseDate = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
      return isSameMonth(expenseDate, selectedMonth)
    });

    if (filteredExpenses.length === 0) return [];

    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      const category = (categories || []).find(c => c.id === expense.categoryId);
      const categoryName = category?.name || 'Other';
      acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, total]) => ({
      name: category,
      value: total,
      fill: `var(--color-${category.toLowerCase()})`,
    }));
  }, [expenses, categories, selectedMonth]);

  const chartConfig = {
    value: {
      label: 'Amount',
    },
    ...(categories || []).reduce((acc, cat) => {
        acc[cat.name.toLowerCase()] = {
            label: cat.name,
            color: `hsl(var(--chart-${Object.keys(acc).length + 1}))`
        }
        return acc;
    }, {} as any)
  } as const;

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);
  
  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setSelectedMonth(new Date(year, month -1));
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-6 pb-4">
        <CardDescription className='-mt-2'>
            A breakdown of your spending.
        </CardDescription>
        <Select
            value={format(selectedMonth, 'yyyy-MM')}
            onValueChange={handleMonthChange}
            disabled={availableMonths.length === 0}
        >
            <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
            {availableMonths.map((month) => (
                <SelectItem key={format(month, 'yyyy-MM')} value={format(month, 'yyyy-MM')}>
                {format(month, 'MMMM yyyy')}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
      </div>

       {chartData.length === 0 ? (
         <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-lg border mx-6 mb-6">
           <p className="text-muted-foreground">No spending data for this month.</p>
         </div>
       ) : (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[400px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalValue.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                          })}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Spent
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
       )}
    </>
  );
}
