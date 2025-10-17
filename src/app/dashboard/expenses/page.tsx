'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { getColumns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { useAppContext } from '@/context/app-context';
import { type Expense, WithId } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { RecurringExpenseDetector } from '@/components/dashboard/recurring-expense-detector';

export default function ExpensesPage() {
  const { state, addExpense, updateExpense, deleteExpense } = useAppContext();
  const { toast } = useToast();
  const { expenses, categories, loading } = state;
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<WithId<Expense> | undefined>(undefined);

  const handleAddExpense = () => {
    setEditingExpense(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditExpense = (expense: WithId<Expense>) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  }

  const handleDeleteExpense = (expenseId: string) => {
    if(confirm('Are you sure you want to delete this expense?')) {
        deleteExpense(expenseId);
        toast({ title: 'Expense deleted' });
    }
  }

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'> & { id?: string }) => {
    if (expenseData.id) {
        updateExpense(expenseData as WithId<Expense>);
        toast({ title: 'Expense updated' });
    } else {
        const { id, ...newExpenseData } = expenseData;
        addExpense(newExpenseData);
        toast({ title: 'Expense added' });
    }
  };

  const columns = React.useMemo(() => getColumns({ 
      onEdit: handleEditExpense, 
      onDelete: handleDeleteExpense,
      categories: categories || []
  }), [categories]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Expenses"
        description="Manage your expenses here. Add, edit, or delete them as you wish."
        actions={
          <Button onClick={handleAddExpense} disabled={loading.categories}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        }
      />
      <RecurringExpenseDetector />
      {loading.expenses || loading.categories ? (
         <div className="space-y-4">
            <div className="flex items-center">
                <Skeleton className="h-10 w-[250px]" />
            </div>
            <div className="rounded-md border">
                <div className="w-full space-y-2 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
         </div>
      ) : (
        <DataTable columns={columns} data={expenses} filterColumn='title' filterPlaceholder='Filter by title...'/>
      )}


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update the details of your expense.' : 'Fill in the details of your new expense.'}
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense}
            categories={categories}
            onSave={handleSaveExpense}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
