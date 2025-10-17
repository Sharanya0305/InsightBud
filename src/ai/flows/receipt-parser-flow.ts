'use server';
/**
 * @fileOverview A flow for parsing expense receipts.
 *
 * - parseReceipt - A function that parses a receipt image and returns structured data.
 * - ParseReceiptInput - The input type for the parseReceipt function.
 * - ParseReceiptOutput - The return type for the parseReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseReceiptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseReceiptInput = z.infer<typeof ParseReceiptInputSchema>;

const ParseReceiptOutputSchema = z.object({
  title: z.string().describe('A suitable title for the expense based on the receipt (e.g., vendor name).'),
  amount: z.number().describe('The total amount of the expense.'),
  date: z.string().datetime().describe('The date of the expense in ISO 8601 format.'),
});
export type ParseReceiptOutput = z.infer<typeof ParseReceiptOutputSchema>;


export async function parseReceipt(input: ParseReceiptInput): Promise<ParseReceiptOutput> {
    return parseReceiptFlow(input);
}


const prompt = ai.definePrompt({
    name: 'parseReceiptPrompt',
    input: {schema: ParseReceiptInputSchema},
    output: {schema: ParseReceiptOutputSchema},
    prompt: `You are an expert receipt-scanning assistant. Analyze the provided receipt image and extract the following information:
    1.  A concise title for the expense (usually the merchant's name).
    2.  The total amount of the transaction.
    3.  The date of the transaction.

    Return the data in the specified JSON format. The date should be a valid ISO 8601 date string.

    Receipt Image: {{media url=photoDataUri}}`
});

const parseReceiptFlow = ai.defineFlow(
    {
        name: 'parseReceiptFlow',
        inputSchema: ParseReceiptInputSchema,
        outputSchema: ParseReceiptOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        return output!;
    }
)
