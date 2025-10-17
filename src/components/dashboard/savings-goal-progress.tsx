'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { type SavingsGoal, WithId } from '@/lib/types';
import { Target } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';

type SavingsGoalProgressProps = {
  goal?: WithId<SavingsGoal>;
  showCard?: boolean;
};

export function SavingsGoalProgress({ goal, showCard = true }: SavingsGoalProgressProps) {
  const { state } = useAppContext();
  const { loading, savingsGoals } = state;
  
  // Use the first savings goal if no specific goal is provided
  const targetGoal = goal || (savingsGoals || []).find(g => g.currentAmount < g.targetAmount) || (savingsGoals || [])[0];

  if (loading.savingsGoals && showCard) {
      return <Skeleton className="h-[220px]" />
  }

  if (!targetGoal) {
    if (!showCard) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Savings Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center gap-4 p-4">
            <Target className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No savings goals set yet.</p>
            <Link href="/dashboard/savings" className="text-sm font-medium text-primary hover:underline">
              Set a new goal
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { name, currentAmount, targetAmount } = targetGoal;
  const progress = (currentAmount / targetAmount) * 100;

  const content = (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-baseline text-sm">
          <span className="font-medium">Rs.{currentAmount.toFixed(2)}</span>
          <span className="text-muted-foreground">of Rs.{targetAmount.toFixed(2)}</span>
        </div>
        <Progress value={progress} />
        <div className="text-center text-sm min-h-[40px] flex items-center justify-center">
          {progress >= 100 ? (
             <p className="font-semibold text-primary animate-fade-in">
                🎉 Goal achieved! Congratulations! 🎉
             </p>
          ) : (
            <p className="text-muted-foreground">
              You are <span className="font-bold text-foreground">{progress.toFixed(0)}%</span> of the way to your goal.
            </p>
          )}
        </div>
      </div>
       <style jsx>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.5s ease-in-out;
            }
        `}</style>
    </>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Goal</CardTitle>
        <CardDescription>{name}</CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
