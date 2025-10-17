'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { type SavingsGoal, WithId } from '@/lib/types';
import { Banknote } from 'lucide-react';

const contributionSchema = z.object({
  amount: z.coerce.number().positive('Contribution must be a positive number.'),
});

type SavingsContributionDialogProps = {
  goal: WithId<SavingsGoal> | null;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (goal: WithId<SavingsGoal>, amount: number) => void;
};

export function SavingsContributionDialog({ goal, onOpenChange, onSave }: SavingsContributionDialogProps) {
  const form = useForm<z.infer<typeof contributionSchema>>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const isOpen = !!goal;

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  function onSubmit(values: z.infer<typeof contributionSchema>) {
    if (goal) {
      onSave(goal, values.amount);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add to "{goal?.name}"</DialogTitle>
              <DialogDescription>
                How much would you like to add to this savings goal?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contribution Amount</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="0.00" className="pl-9" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Add Contribution</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
