'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/receipt-parser-flow.ts';
import '@/ai/flows/savings-goal-message-flow.ts';
import '@/ai/flows/spending-insights-flow.ts';
import '@/ai/flows/recurring-expense-detector.ts';
import '@/ai/flows/savings-streak-flow.ts';
import '@/ai/flows/finance-chatbot-flow.ts';
