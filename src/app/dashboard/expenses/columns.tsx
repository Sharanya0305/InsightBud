'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type Expense, WithId, type Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


type ColumnsProps = {
    onEdit: (expense: WithId<Expense>) => void;
    onDelete: (expenseId: string) => void;
    categories: WithId<Category>[];
}

export const getColumns = ({ onEdit, onDelete, categories }: ColumnsProps): ColumnDef<WithId<Expense>>[] => [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
        const isRecurring = row.original.isRecurring;
        return (
            <div className="font-medium flex items-center gap-2">
                {row.getValue('title')}
                {isRecurring && <Repeat className="h-3 w-3 text-muted-foreground" title="Recurring" />}
            </div>
        )
    },
  },
  {
    accessorKey: 'categoryId',
    header: 'Category',
    cell: ({ row }) => {
        const categoryId = row.getValue('categoryId');
        const category = categories.find(c => c.id === categoryId);
        return <Badge variant="outline">{category?.name || 'N/A'}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-right w-full justify-end"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
        const dateValue = row.getValue('date');
        // Firestore timestamps need to be converted to JS Dates
        if (dateValue instanceof Timestamp) {
            return <div>{format(dateValue.toDate(), 'PPP')}</div>;
        }
        // Handle cases where it might already be a Date object or a string
        try {
          const date = new Date(dateValue as any);
          if (!isNaN(date.getTime())) {
            return <div>{format(date, 'PPP')}</div>;
          }
        } catch (e) {
          // Fallback for invalid date values
          return <div>Invalid Date</div>
        }
        return <div>Invalid Date</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const expense = row.original;

      return (
        <div className="text-right">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(expense.id)}>
                    Copy expense ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(expense)}>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(expense.id)}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
