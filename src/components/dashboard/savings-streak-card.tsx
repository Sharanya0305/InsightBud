'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Flame, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { analyzeSavingsStreak, type SavingsStreakOutput } from '@/ai/flows/savings-streak-flow';
import { Timestamp } from 'firebase/firestore';


export function SavingsStreakCard() {
  const { state } = useAppContext();
  const { contributions, loading } = state;
  const { toast } = useToast();
  
  const [streakInfo, setStreakInfo] = React.useState<SavingsStreakOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (loading.contributions) {
      return;
    }

    const fetchStreakInfo = async () => {
      setIsLoading(true);
      try {
        // Ensure contributions are in the correct format for the AI flow
        const processedContributions = (contributions || []).map(c => ({
          ...c,
          date: c.date instanceof Timestamp ? c.date.toDate().toISOString() : new Date(c.date).toISOString(),
        }));
        
        const result = await analyzeSavingsStreak({ contributions: processedContributions });
        setStreakInfo(result);

      } catch (error) {
        console.error("Failed to analyze savings streak:", error);
        // Don't show a toast for this background task, but set a fallback message
        setStreakInfo({
            currentMonthSavings: 0,
            streakMonths: 0,
            message: "Could not load savings analysis. Please try again later."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreakInfo();
  }, [contributions, loading.contributions]);

  if (isLoading) {
    return <Skeleton className="h-[150px] w-full" />;
  }

  if (!streakInfo) {
    return null; // Or some other fallback UI
  }

  return (
    <Card className="bg-gradient-to-r from-background to-card/50 border-primary/20 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-primary" />
            </div>
            <div>
                <CardTitle>Your Savings Streak</CardTitle>
                <CardDescription>{streakInfo.message}</CardDescription>
            </div>
        </div>
        {streakInfo.streakMonths > 0 && (
            <div className="text-center">
                <p className="text-4xl font-bold text-primary">{streakInfo.streakMonths}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Month{streakInfo.streakMonths > 1 ? 's' : ''}</p>
            </div>
        )}
      </CardHeader>
      {streakInfo.currentMonthSavings > 0 && (
        <CardContent>
            <div className="text-center bg-primary/5 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">You've saved</p>
                <p className="text-2xl font-bold text-primary">Rs.{streakInfo.currentMonthSavings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">so far this month!</p>
            </div>
        </CardContent>
      )}
    </Card>
  );
}
