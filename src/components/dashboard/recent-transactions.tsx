'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';

export function RecentTransactions() {
  const { state } = useAppContext();
  const { expenses, categories } = state;

  const recentExpenses = [...(expenses || [])]
    .sort((a, b) => {
        const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
        const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const formatDate = (date: any) => {
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'PPP');
    }
    return format(new Date(date), 'PPP');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="grid gap-2">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
                Your 5 most recent expenses.
            </CardDescription>
        </div>
        <Button asChild size="sm">
            <Link href="/dashboard/expenses">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="font-medium">{expense.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(categories || []).find((c) => c.id === expense.categoryId)?.name || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    Rs.{expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDate(expense.date)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No transactions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
