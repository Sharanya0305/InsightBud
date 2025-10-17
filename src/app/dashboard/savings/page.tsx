'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Banknote, CheckCircle2 } from 'lucide-react';
import { type SavingsGoal, WithId } from '@/lib/types';
import { SavingsGoalProgress } from '@/components/dashboard/savings-goal-progress';
import { SavingsContributionDialog } from '@/components/dashboard/savings-contribution-dialog';
import { Separator } from '@/components/ui/separator';
import { generateAppreciationMessage } from '@/ai/flows/savings-goal-message-flow';
import { GoalAccomplishedDialog } from '@/components/dashboard/goal-accomplished-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SavingsStreakCard } from '@/components/dashboard/savings-streak-card';

const savingsGoalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters.'),
  targetAmount: z.coerce.number().positive('Target must be a positive number.'),
  currentAmount: z.coerce.number().min(0, 'Current amount cannot be negative.'),
});

type AccomplishedGoalState = {
    goal: WithId<SavingsGoal>;
    message: string;
}

export default function SavingsPage() {
  const { state, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addContribution, clearAccomplishedGoal } = useAppContext();
  const { toast } = useToast();
  const { savingsGoals, loading, justAccomplishedGoal } = state;
  const [editingGoal, setEditingGoal] = React.useState<WithId<SavingsGoal> | null>(null);
  const [contributionGoal, setContributionGoal] = React.useState<WithId<SavingsGoal> | null>(null);
  const [accomplishedGoalState, setAccomplishedGoalState] = React.useState<AccomplishedGoalState | null>(null);

  const activeGoals = (savingsGoals || []).filter(g => g.currentAmount < g.targetAmount);
  const accomplishedGoals = (savingsGoals || []).filter(g => g.currentAmount >= g.targetAmount);

  const form = useForm<z.infer<typeof savingsGoalSchema>>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: '',
      targetAmount: 1000,
      currentAmount: 0,
    },
  });
  
  React.useEffect(() => {
    if (editingGoal) {
      form.reset(editingGoal);
    } else {
      form.reset({ name: '', targetAmount: 1000, currentAmount: 0 });
    }
  }, [editingGoal, form]);
  
  React.useEffect(() => {
    if (justAccomplishedGoal) {
      const handleAccomplishment = async () => {
        try {
          const result = await generateAppreciationMessage({ goalName: justAccomplishedGoal.name });
          setAccomplishedGoalState({ goal: justAccomplishedGoal, message: result.message });
        } catch (err) {
          console.error("Failed to generate appreciation message", err);
          setAccomplishedGoalState({ 
            goal: justAccomplishedGoal, 
            message: `🎉 Congratulations on reaching your goal: ${justAccomplishedGoal.name}! 🎉` 
          });
        }
      };
      handleAccomplishment();
    }
  }, [justAccomplishedGoal]);

  function onSubmit(values: z.infer<typeof savingsGoalSchema>) {
    if (editingGoal) {
      updateSavingsGoal({ ...values, id: editingGoal.id });
      toast({ title: 'Success', description: 'Savings goal updated.' });
    } else {
      addSavingsGoal(values);
      toast({ title: 'Success', description: 'New savings goal created.' });
    }
    setEditingGoal(null);
  }
  
  const handleSetEditing = (goal: WithId<SavingsGoal>) => {
    setEditingGoal(goal);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleClearForm = () => {
    setEditingGoal(null);
    form.reset({ name: '', targetAmount: 1000, currentAmount: 0 });
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      deleteSavingsGoal(id);
      toast({ title: 'Success', description: 'Savings goal deleted.' });
      if (editingGoal && editingGoal.id === id) {
        handleClearForm();
      }
    }
  }
  
  const handleAddContribution = (goal: WithId<SavingsGoal>, amount: number) => {
    addContribution(goal.id, amount);
     toast({
         title: 'Contribution Added!',
         description: `Rs.${amount.toFixed(2)} was added to your "${goal.name}" goal.`,
       });
  };
  
  const handleDialogClose = () => {
      setAccomplishedGoalState(null);
      clearAccomplishedGoal();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Savings Goals" description="Set and track your savings goals." />
      
      <SavingsStreakCard />

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{editingGoal ? 'Edit Savings Goal' : 'Create a New Savings Goal'}</CardTitle>
              <CardDescription>
                {editingGoal ? 'Update the details of your savings goal.' : 'Define a new goal to work towards.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., New Laptop, Vacation Fund" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                       <FormDescription>
                          How much do you want to save?
                        </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Amount</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                       <FormDescription>
                          How much have you saved already?
                        </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="submit" disabled={form.formState.isSubmitting}>{editingGoal ? 'Save Changes' : 'Create Goal'}</Button>
              {editingGoal && (
                <Button variant="ghost" onClick={handleClearForm}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create a new goal
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Active Goals</h2>
        {loading.savingsGoals ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map(goal => (
                <Card key={goal.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{goal.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <SavingsGoalProgress goal={goal} showCard={false} />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" onClick={() => setContributionGoal(goal)}>
                            <Banknote className="mr-2 h-4 w-4" />
                            Add Money
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleSetEditing(goal)}>Edit</Button>
                        </div>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(goal.id)}><Trash2 className="h-4 w-4" /></Button>
                    </CardFooter>
                </Card>
            ))}
            {activeGoals.length === 0 && !loading.savingsGoals && (
                <p className="text-muted-foreground col-span-full text-center py-8">You have no active savings goals. Create one above to get started!</p>
            )}
          </div>
        )}
      </div>
      
      {accomplishedGoals.length > 0 && (
         <div>
            <Separator className="my-8" />
            <h2 className="text-2xl font-bold tracking-tight mb-4">Accomplished Goals</h2>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accomplishedGoals.map(goal => (
                     <Card key={goal.id} className="flex flex-col border-primary/30 bg-card/80">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>{goal.name}</CardTitle>
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <div className="text-center">
                                <p className="text-sm text-muted-foreground">Target Achieved!</p>
                                <p className="text-2xl font-bold">Rs.{goal.targetAmount.toFixed(2)}</p>
                             </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(goal.id)}><Trash2 className="h-4 w-4" /></Button>
                        </CardFooter>
                    </Card>
                ))}
             </div>
         </div>
      )}
      
      <SavingsContributionDialog
        goal={contributionGoal}
        onOpenChange={(isOpen) => !isOpen && setContributionGoal(null)}
        onSave={handleAddContribution}
      />
      <GoalAccomplishedDialog
        goal={accomplishedGoalState?.goal}
        message={accomplishedGoalState?.message}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                handleDialogClose();
            }
        }}
      />
    </div>
  );
}
