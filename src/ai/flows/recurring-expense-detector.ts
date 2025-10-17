'use server';

/**
 * @fileOverview An AI flow to detect recurring expenses from a list of transactions.
 *
 * - detectRecurringExpenses - Analyzes expenses and identifies potential subscriptions or regular bills.
 */

import { ai } from '@/ai/genkit';
import {
  type DetectRecurringExpensesInput,
  type DetectRecurringExpensesOutput,
  DetectRecurringExpensesInputSchema,
  DetectRecurringExpensesOutputSchema,
} from '@/lib/types';


// The main exported function that client components will call.
export async function detectRecurringExpenses(
  input: DetectRecurringExpensesInput
): Promise<DetectRecurringExpensesOutput> {
  return recurringExpenseDetectorFlow(input);
}

// Define the AI prompt for detecting recurring expenses.
const prompt = ai.definePrompt({
  name: 'recurringExpensePrompt',
  input: { schema: DetectRecurringExpensesInputSchema },
  output: { schema: DetectRecurringExpensesOutputSchema },
  prompt: `You are an expert financial analyst specializing in identifying recurring expenses from transaction data.
  
You will be given a list of expenses. Your task is to find transactions that are likely to be recurring subscriptions or regular bills (e.g., Netflix, Spotify, rent, utilities).

Analyze the list for expenses with similar titles and amounts that occur at regular monthly or yearly intervals. Ignore expenses that have already been marked as 'isRecurring: true'.

Return a list of the 'id' fields for only the expenses that you identify as being part of a recurring pattern.

## Expense Data
{{{json expenses}}}
`,
});

// Define the Genkit flow that orchestrates the AI call.
const recurringExpenseDetectorFlow = ai.defineFlow(
  {
    name: 'recurringExpenseDetectorFlow',
    inputSchema: DetectRecurringExpensesInputSchema,
    outputSchema: DetectRecurringExpensesOutputSchema,
  },
  async input => {
    // Filter out expenses that are already marked as recurring before sending to the AI.
    const nonRecurringExpenses = input.expenses.filter(e => !e.isRecurring);

    // If there's not enough data to analyze, return an empty list.
    if (nonRecurringExpenses.length < 3) {
      return { recurringExpenseIds: [] };
    }

    const { output } = await prompt({ expenses: nonRecurringExpenses });
    return output!;
  }
);
