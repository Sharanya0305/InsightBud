import { z } from 'zod';

export type Category = {
  name: string;
  userId: string;
}

export interface Expense {
  title: string;
  notes?: string;
  amount: number;
  date: Date | string; // Allow string for serialization
  categoryId: string;
  userId: string;
  isRecurring?: boolean;
}

export interface Budget {
  amount: number;
  userId: string;
  createdAt: Date | string;
}

export interface SavingsGoal {
    name: string;
    targetAmount: number;
    currentAmount: number;
    userId: string;
}

export interface Contribution {
    goalId: string;
    amount: number;
    date: string; // ISO Date string
    userId: string;
}

export interface Rollover {
    month: string; // e.g., "2024-07"
    transferredAmount: number;
    transferredToGoalId: string;
    userId: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}


export type WithId<T> = T & { id: string };


// --- Recurring Expense Detection Schemas ---

const ExpenseForRecurringDetectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  amount: z.number(),
  date: z.string().datetime(), // Dates must be ISO strings for server functions
  categoryId: z.string(),
  isRecurring: z.boolean().optional(),
});

export const DetectRecurringExpensesInputSchema = z.object({
  expenses: z
    .array(ExpenseForRecurringDetectionSchema)
    .describe(
      'A list of user expenses to be analyzed for recurring patterns.'
    ),
});
export type DetectRecurringExpensesInput = z.infer<
  typeof DetectRecurringExpensesInputSchema
>;

export const DetectRecurringExpensesOutputSchema = z.object({
  recurringExpenseIds: z
    .array(z.string())
    .describe(
      'A list of IDs of expenses that have been identified as recurring.'
    ),
});
export type DetectRecurringExpensesOutput = z.infer<
  typeof DetectRecurringExpensesOutputSchema
>;

// --- Savings Streak Schemas ---
const ContributionForStreakSchema = z.object({
  id: z.string(),
  amount: z.number(),
  date: z.string().datetime(), // Expect ISO date strings
  goalId: z.string(),
  userId: z.string(),
});

export const SavingsStreakInputSchema = z.object({
  contributions: z.array(ContributionForStreakSchema).describe("The user's entire contribution history."),
});
export type SavingsStreakInput = z.infer<typeof SavingsStreakInputSchema>;

export const SavingsStreakOutputSchema = z.object({
  currentMonthSavings: z.number().describe('Total amount saved in the current calendar month.'),
  streakMonths: z.number().describe('The number of consecutive months the user has saved a positive amount.'),
  message: z.string().describe('A short, encouraging, and creative message for the user based on their performance.'),
});
export type SavingsStreakOutput = z.infer<typeof SavingsStreakOutputSchema>;


// --- Finance Chatbot Schemas ---

const ExpenseForChatbotSchema = z.object({
  id: z.string(),
  title: z.string(),
  amount: z.number(),
  date: z.string().datetime(),
  categoryId: z.string(),
  isRecurring: z.boolean().optional(),
});

const CategoryForChatbotSchema = z.object({
    id: z.string(),
    name: z.string(),
});

const BudgetForChatbotSchema = z.object({
    amount: z.number(),
    createdAt: z.string().datetime(),
});

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const FinanceChatbotInputSchema = z.object({
  query: z.string().describe("The user's most recent question."),
  expenses: z.array(ExpenseForChatbotSchema).describe("The user's full expense history."),
  categories: z.array(CategoryForChatbotSchema).describe("The available expense categories."),
  budget: BudgetForChatbotSchema.nullable().describe("The user's monthly budget."),
  history: z.array(MessageSchema).describe("The previous messages in this conversation."),
});
export type FinanceChatbotInput = z.infer<typeof FinanceChatbotInputSchema>;


export const FinanceChatbotOutputSchema = z.object({
  answer: z.string().describe("The chatbot's answer to the user's query."),
});
export type FinanceChatbotOutput = z.infer<typeof FinanceChatbotOutputSchema>;
