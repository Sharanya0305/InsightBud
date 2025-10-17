'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';
import { SpendingHeatmap } from '@/components/dashboard/spending-heatmap';
import { SpendingBarChart } from '@/components/dashboard/spending-bar-chart';
import { CategoryPieChart } from '@/components/dashboard/category-pie-chart';

export default function ReportsPage() {
  const { state } = useAppContext();
  const { expenses, categories, loading } = state;
  const { toast } = useToast();

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [categoryId, setCategoryId] = React.useState<string>('all');

  const filteredExpenses = React.useMemo(() => {
    return (expenses || []).filter((expense) => {
      const expenseDate = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
      const isAfterFrom = date?.from ? expenseDate >= date.from : true;
      const isBeforeTo = date?.to ? expenseDate <= date.to : true;
      const isInDateRange = isAfterFrom && isBeforeTo;
      
      const isInCategory = categoryId === 'all' || expense.categoryId === categoryId;

      return isInDateRange && isInCategory;
    });
  }, [expenses, date, categoryId]);

  const totalAmount = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  
  const handleExport = () => {
    // In a real app, this would trigger a file download.
    toast({
        title: "Export Started",
        description: "Your report is being generated. This is a demo feature."
    });
  }
  
  const formatDate = (date: any) => {
    if (date instanceof Timestamp) {
        return format(date.toDate(), 'PPP');
    }
    return format(new Date(date), 'PPP');
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Analyze your spending with visual charts and detailed reports."
      />
      <SpendingHeatmap />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>A look at your spending over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.expenses ? <Skeleton className="h-[300px]" /> : <SpendingBarChart />}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading.expenses || loading.categories ? <Skeleton className="h-[300px] m-6" /> : <CategoryPieChart />}
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
           <CardDescription>
            Filter your expenses by date and category to generate a detailed report.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-[300px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} -{' '}
                        {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select value={categoryId} onValueChange={(value) => setCategoryId(value as string)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(categories || []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='ml-auto'>
                <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading.expenses || loading.categories ? <Skeleton className="h-64 w-full" /> : (
            <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell><Badge variant="outline">{(categories || []).find(c => c.id === expense.categoryId)?.name || 'N/A'}</Badge></TableCell>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell className="text-right">Rs.{expense.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No expenses found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={3} className="font-bold text-lg">Total</TableCell>
                    <TableCell className="text-right font-bold text-lg">Rs.{totalAmount.toFixed(2)}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
