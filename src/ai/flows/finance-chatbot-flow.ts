'use server';
/**
 * @fileOverview An AI flow for a conversational finance Q&A chatbot.
 *
 * - answerFinancialQuery - Analyzes user questions about their finances and provides answers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  FinanceChatbotInputSchema,
  FinanceChatbotOutputSchema,
  type FinanceChatbotInput,
  type FinanceChatbotOutput,
} from '@/lib/types';

export async function answerFinancialQuery(
  input: FinanceChatbotInput
): Promise<FinanceChatbotOutput> {
  return financeChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financeChatbotPrompt',
  input: { schema: FinanceChatbotInputSchema },
  output: { schema: FinanceChatbotOutputSchema },
  prompt: `You are a friendly and knowledgeable financial assistant chatbot called InsightBud. Your goal is to answer the user's questions about their personal finances based on the data provided. The current date is ${new Date().toISOString()}.

Use the provided conversation history to understand the context of the current question.

Analyze the user's expenses, categories, and budget to answer their question accurately. Be conversational and helpful in your response.

If you don't know the answer or the data is insufficient, say so. Do not make up information. The currency is Rupees (Rs.).

## Conversation History
{{#each history}}
- {{role}}: {{content}}
{{/each}}

## Current User Question
{{query}}

## Financial Data
Budget: {{{json budget}}}
Expenses: {{{json expenses}}}
Categories: {{{json categories}}}
`,
});

const financeChatbotFlow = ai.defineFlow(
  {
    name: 'financeChatbotFlow',
    inputSchema: FinanceChatbotInputSchema,
    outputSchema: FinanceChatbotOutputSchema,
  },
  async input => {
    // If there's not enough data, provide a helpful default response without calling the AI.
    if (!input.expenses || input.expenses.length === 0) {
      return {
        answer:
          "I don't have any of your expense data to analyze yet. Once you add some expenses, I can answer your questions!",
      };
    }

    const { output } = await prompt(input);
    return output!;
  }
);
