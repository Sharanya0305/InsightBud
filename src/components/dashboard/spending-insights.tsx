'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { generateSpendingInsights, type SpendingInsightsOutput } from '@/ai/flows/spending-insights-flow';
import { BrainCircuit, Lightbulb, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Timestamp } from 'firebase/firestore';

export function SpendingInsights() {
  const { state } = useAppContext();
  const { expenses, categories, loading } = state;
  const { toast } = useToast();
  
  const [insights, setInsights] = React.useState<SpendingInsightsOutput | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = React.useState(true);

  React.useEffect(() => {
    // Don't run if the main data is still loading
    if (loading.expenses || loading.categories) {
      return;
    }

    const fetchInsights = async () => {
      setIsLoadingInsights(true);
      try {
        // Pre-process expenses to ensure they match the AI flow's Zod schema.
        // This includes converting dates and ensuring all required fields are present.
        const processedExpenses = expenses.map(e => {
            const date = e.date;
            let dateString: string;

            if (date instanceof Timestamp) {
                dateString = date.toDate().toISOString();
            } else if (date instanceof Date) {
                dateString = date.toISOString();
            } else {
                // Assuming it's already a string or a format Date can parse
                dateString = new Date(date).toISOString();
            }
            
            return {
                id: e.id,
                title: e.title,
                amount: e.amount,
                date: dateString,
                categoryId: e.categoryId,
                userId: e.userId,
                notes: e.notes || '', // Ensure notes is a string, not undefined
            };
        });

        const result = await generateSpendingInsights({ expenses: processedExpenses, categories });
        setInsights(result);
      } catch (error) {
        console.error("Failed to generate spending insights:", error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Could not generate spending insights.",
        });
        // Set a default error state for insights
        setInsights({
          predictedNextMonthTotal: 0,
          overallInsight: "We couldn't generate insights right now. Please try again later.",
          categoryInsights: [],
          savingsRecommendations: [],
        });
      } finally {
        setIsLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [expenses, categories, loading.expenses, loading.categories, toast]);
  
  if (isLoadingInsights) {
    return <Skeleton className="h-[240px] w-full" />;
  }

  if (!insights) {
    return null; // Or some other fallback UI
  }
  
  const hasEnoughData = insights.categoryInsights.length > 0 || insights.savingsRecommendations.length > 0;

  return (
    <Card className="bg-gradient-to-r from-background to-card/50 border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-primary" />
            </div>
            <div>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>{insights.overallInsight}</CardDescription>
            </div>
        </div>
      </CardHeader>
      {hasEnoughData && (
        <CardContent className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-2 rounded-lg bg-card/50 p-4">
                    <p className="text-sm text-muted-foreground">Predicted Next Month Total</p>
                    <p className="text-2xl font-bold">Rs.{insights.predictedNextMonthTotal.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">AI-based estimation of your upcoming expenses.</p>
                </div>
                {insights.categoryInsights.map((insight, index) => {
                    const isUp = insight.insight.includes('up');
                    const isDown = insight.insight.includes('down');

                    return (
                        <div key={index} className="flex flex-col gap-2 rounded-lg bg-card/50 p-4">
                            <p className="text-sm font-bold flex items-center justify-between">
                                <span>{insight.categoryName}</span>
                                {isUp && <TrendingUp className="h-4 w-4 text-orange-500" />}
                                {isDown && <TrendingDown className="h-4 w-4 text-green-500" />}
                                {!isUp && !isDown && <Wallet className="h-4 w-4 text-muted-foreground" />}
                            </p>
                            <p className="text-lg font-semibold">~Rs.{insight.prediction.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{insight.insight}</p>
                        </div>
                    )
                })}
            </div>
            {insights.savingsRecommendations && insights.savingsRecommendations.length > 0 && (
                <div className="flex flex-col gap-4 rounded-lg bg-primary/5 border border-primary/10 p-4">
                    <div className="flex items-center gap-3">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">Smart Savings</h4>
                    </div>
                     <div className="space-y-2 text-sm text-foreground/90 pl-8">
                        {insights.savingsRecommendations.map((rec, index) => (
                          <p key={index}>{rec.recommendation}</p>
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
      )}
    </Card>
  );
}
