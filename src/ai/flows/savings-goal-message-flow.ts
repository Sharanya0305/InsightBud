'use server';

/**
 * @fileOverview A flow for generating a celebratory message for a completed savings goal.
 *
 * - generateAppreciationMessage - A function that creates a congratulatory message.
 * - AppreciationMessageInput - The input type for the function.
 * - AppreciationMessageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AppreciationMessageInputSchema = z.object({
  goalName: z.string().describe('The name of the completed savings goal.'),
});
export type AppreciationMessageInput = z.infer<
  typeof AppreciationMessageInputSchema
>;

const AppreciationMessageOutputSchema = z.object({
  message: z
    .string()
    .describe('The short, celebratory message for the user.'),
});
export type AppreciationMessageOutput = z.infer<
  typeof AppreciationMessageOutputSchema
>;

export async function generateAppreciationMessage(
  input: AppreciationMessageInput
): Promise<AppreciationMessageOutput> {
  return appreciationMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'appreciationMessagePrompt',
  input: {schema: AppreciationMessageInputSchema},
  output: {schema: AppreciationMessageOutputSchema},
  prompt: `You are a friendly and encouraging financial assistant. A user has just completed their savings goal called '{{goalName}}'.

Write a short, celebratory, and appreciative message for them. Congratulate them and specifically mention what they saved for.

For example, if the goal is 'New Gaming PC', a great message would be 'Well done! You've reached your goal and are going to buy a new Gaming PC!'.
If the goal is 'Summer Vacation', you could say 'Congratulations! Your summer vacation is fully funded. Enjoy your trip!'.

Keep it concise and exciting.`,
});

const appreciationMessageFlow = ai.defineFlow(
  {
    name: 'appreciationMessageFlow',
    inputSchema: AppreciationMessageInputSchema,
    outputSchema: AppreciationMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
