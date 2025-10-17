'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import React from 'react';
import { BudgetRollover } from '@/components/dashboard/budget-rollover';
import { Skeleton } from '@/components/ui/skeleton';

const budgetFormSchema = z.object({
  amount: z.coerce.number().positive('Budget must be a positive number.'),
});

export default function BudgetsPage() {
  const { state, setBudget } = useAppContext();
  const { toast } = useToast();
  const { budget, loading } = state;
  
  const form = useForm<z.infer<typeof budgetFormSchema>>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      amount: budget?.amount || 0,
    },
  });
    
  React.useEffect(() => {
    if (budget) {
      form.reset({ amount: budget.amount });
    }
  }, [budget, form]);


  function onSubmit(values: z.infer<typeof budgetFormSchema>) {
    setBudget({ amount: values.amount });
    toast({
      title: 'Budget Updated!',
      description: `Your monthly budget has been set to Rs.${values.amount.toFixed(2)}.`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Budgets"
        description="Set and manage your monthly budget goals."
      />
       {loading.budget ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[250px] w-full" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Set Monthly Budget</CardTitle>
                        <CardDescription>
                            Enter the total amount you want to budget for this month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Budget Amount</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="1000.00" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">
                           {budget?.amount ? 'Save Budget' : 'Set Budget'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>

        <BudgetProgress />
      </div>
      )}
      <BudgetRollover />
    </div>
  );
}
