'use server';
/**
 * @fileOverview An AI flow to analyze savings streaks and generate motivational messages.
 *
 * - analyzeSavingsStreak - Analyzes contribution history to determine savings streaks.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { format, subMonths, startOfMonth, isSameMonth } from 'date-fns';
import { SavingsStreakInputSchema, SavingsStreakOutputSchema, type SavingsStreakInput, type SavingsStreakOutput } from '@/lib/types';


// --- Main exported function ---

export async function analyzeSavingsStreak(input: SavingsStreakInput): Promise<SavingsStreakOutput> {
  return savingsStreakFlow(input);
}


// --- Logic Helper Functions ---

const calculateStreak = (contributions: SavingsStreakInput['contributions']) => {
    if (contributions.length === 0) {
        return { streakMonths: 0, currentMonthSavings: 0 };
    }

    const monthlySavings: Record<string, number> = {};

    // Aggregate contributions by month
    for (const contribution of contributions) {
        const monthKey = format(startOfMonth(new Date(contribution.date)), 'yyyy-MM');
        monthlySavings[monthKey] = (monthlySavings[monthKey] || 0) + contribution.amount;
    }

    const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM');
    const currentMonthSavings = monthlySavings[currentMonthKey] || 0;

    let streak = 0;
    let monthCursor = new Date();

    // Check current month
    if (currentMonthSavings > 0) {
        streak++;
    }

    // Check previous months
    // We only continue checking if the current month has savings.
    if (streak > 0) {
        for (let i = 1; i < 12; i++) { // Check up to 11 previous months
            monthCursor = subMonths(new Date(), i);
            const pastMonthKey = format(startOfMonth(monthCursor), 'yyyy-MM');
            
            if ((monthlySavings[pastMonthKey] || 0) > 0) {
                streak++;
            } else {
                // Streak is broken
                break;
            }
        }
    }
    
    // If there are no savings this month, the streak is 0, regardless of past savings.
    if (currentMonthSavings <= 0) {
        streak = 0;
    }

    return { streakMonths: streak, currentMonthSavings };
};


// --- Genkit Prompt and Flow ---

const prompt = ai.definePrompt({
  name: 'savingsStreakPrompt',
  input: { schema: z.object({ streakMonths: z.number(), currentMonthSavings: z.number() }) },
  output: { schema: SavingsStreakOutputSchema },
  prompt: `You are a fun and motivating financial coach. A user is tracking their savings.

Their current savings streak is {{streakMonths}} months.
This month, they have saved a total of Rs.{{currentMonthSavings}}.

Your task is to write a short, creative, and encouraging message for them based on their performance.

- If the streak is 0 and they haven't saved anything this month, gently encourage them to start.
- If the streak is 0 but they have saved something this month, celebrate that they've started a new streak.
- If the streak is 1, congratulate them on starting a streak.
- If the streak is 3 or more, call it a "solid streak".
- If the streak is 6 or more, call it an "amazing streak" and mention how habits are forming.
- If the streak is 12 or more, celebrate the one-year milestone.

Always mention the amount they've saved this month if it's greater than zero.

Examples:
- (0 streak, 0 savings): "Every great journey starts with a single step. Try adding a little to your goals to kickstart your savings streak!"
- (0 streak, 500 savings): "You've saved Rs.500 this month! That's a fantastic start to a new savings streak!"
- (3 streak, 1200 savings): "That's Rs.1200 saved this month! You're on a solid 3-month savings streak. Keep the momentum going!"
- (6 streak, 2000 savings): "Amazing! You've saved Rs.2000 this month and are on a 6-month streak. You're building an incredible habit!"
`,
});

const savingsStreakFlow = ai.defineFlow(
  {
    name: 'savingsStreakFlow',
    inputSchema: SavingsStreakInputSchema,
    outputSchema: SavingsStreakOutputSchema,
  },
  async (input) => {
    // Calculate streak and monthly savings using our own logic.
    const { streakMonths, currentMonthSavings } = calculateStreak(input.contributions);

    // If there's no data, return a default state without calling the AI.
    if (input.contributions.length === 0) {
        return {
            streakMonths: 0,
            currentMonthSavings: 0,
            message: "Add some money to a savings goal to start your first streak!"
        }
    }

    // Call the AI with the pre-calculated numbers to get the creative message.
    const { output } = await prompt({ streakMonths, currentMonthSavings });

    // The AI's job is just to provide the message. We use our calculated numbers for the final output.
    return {
        streakMonths,
        currentMonthSavings,
        message: output!.message
    };
  }
);
