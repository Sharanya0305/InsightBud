'use server';
/**
 * @fileOverview A flow for generating AI-powered spending insights and predictions.
 *
 * - generateSpendingInsights - Analyzes expense history to predict future spending.
 * - SpendingInsightsInput - The input type for the function.
 * - SpendingInsightsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// We need to define the schema for complex types passed into the flow
const ExpenseSchema = z.object({
    id: z.string(),
    title: z.string(),
    amount: z.number(),
    date: z.string().datetime(), // Pass dates as ISO strings
    categoryId: z.string(),
    notes: z.string().optional(),
    userId: z.string(),
});

const CategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    userId: z.string(),
});

const SpendingInsightsInputSchema = z.object({
  expenses: z.array(ExpenseSchema).describe('The user\'s list of expenses from the last few months.'),
  categories: z.array(CategorySchema).describe('The list of available expense categories.'),
});
export type SpendingInsightsInput = z.infer<typeof SpendingInsightsInputSchema>;


const CategoryInsightSchema = z.object({
    categoryName: z.string().describe('The name of the category.'),
    prediction: z.number().describe('The predicted spending for this category next month.'),
    insight: z.string().describe('A brief, human-readable insight about spending in this category (e.g., "spending is trending up").'),
});

const SavingsRecommendationSchema = z.object({
    recommendation: z.string().describe('A single, actionable savings recommendation.'),
});


const SpendingInsightsOutputSchema = z.object({
  predictedNextMonthTotal: z
    .number()
    .describe('The predicted total spending for the user for the next calendar month.'),
  overallInsight: z
    .string()
    .describe('A concise, overall summary of the user\'s spending habits and prediction.'),
  categoryInsights: z
    .array(CategoryInsightSchema)
    .describe('A list of insights for the top 3-4 spending categories.'),
  savingsRecommendations: z
    .array(SavingsRecommendationSchema)
    .describe('A list of 1-2 personalized and actionable savings recommendations.'),
});
export type SpendingInsightsOutput = z.infer<typeof SpendingInsightsOutputSchema>;

export async function generateSpendingInsights(
  input: SpendingInsightsInput
): Promise<SpendingInsightsOutput> {
  // The input dates are now expected to be ISO strings from the client
  return spendingInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spendingInsightsPrompt',
  input: { schema: SpendingInsightsInputSchema },
  output: { schema: SpendingInsightsOutputSchema },
  prompt: `You are a helpful financial analyst. Your goal is to provide users with predictions and insights about their spending to help them budget better.
  
You are given a list of the user's expenses from the past few months and a list of their categories. The current date is ${new Date().toDateString()}.

Analyze the provided expense data. Perform the following tasks:
1.  **Predict Total Spending for Next Month:** Based on historical data, calculate a predicted total spending amount for the upcoming calendar month.
2.  **Generate an Overall Insight:** Write a short, encouraging, and helpful summary (1-2 sentences) of the user's spending.
3.  **Analyze Top Categories:** Identify the top 3-4 spending categories. For each of these categories:
    a. Predict the spending for the next month.
    b. Provide a short, actionable insight (e.g., "Your spending on Food has been consistent," "Spending on Shopping is trending upwards," "You may overspend on Transportation based on recent trends.").
4.  **Suggest Smart Savings:** Based on the spending analysis, provide 1-2 personalized and actionable savings recommendations. Identify a high-spending category and suggest a small, realistic reduction (e.g., 10-15%). Calculate the potential monthly and yearly savings. Frame it as a clear, encouraging tip. For example: "If you reduce your 'Shopping' spending by 10%, you could save an extra ₹3,500 per month, which is ₹42,000 a year!"

The currency is Rupees (Rs.). Return your analysis in the structured JSON format. Focus on providing realistic predictions and helpful, non-judgmental advice.

## Expense Data
{{{json expenses}}}

## Categories
{{{json categories}}}
`,
});

const spendingInsightsFlow = ai.defineFlow(
  {
    name: 'spendingInsightsFlow',
    inputSchema: SpendingInsightsInputSchema,
    outputSchema: SpendingInsightsOutputSchema,
  },
  async input => {
    // Return a default/empty state if there's not enough data
    if (input.expenses.length < 5) {
        return {
            predictedNextMonthTotal: 0,
            overallInsight: "Start logging more expenses to unlock personalized spending predictions and insights!",
            categoryInsights: [],
            savingsRecommendations: [],
        };
    }
    
    const { output } = await prompt(input);
    return output!;
  }
);
