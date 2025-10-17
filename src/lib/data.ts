import { type Expense, type Category, type SavingsGoal, WithId } from './types';
import { subMonths, subDays, startOfMonth } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export const categories: WithId<Category>[] = [
  { id: 'grocery', name: 'Grocery' },
  { id: 'food', name: 'Food & Dining' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'fashion', name: 'Fashion & Accessories' },
  { id: 'home-appliances', name: 'Home Appliances' },
  { id: 'stationery', name: 'Stationery' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'rent-mortgage', name: 'Rent/Mortgage' },
  { id: 'health', name: 'Health & Wellness' },
  { id: 'education', name: 'Education' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'travel', name: 'Travel' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'gifts', name: 'Gifts & Donations' },
  { id: 'personal-care', name: 'Personal Care' },
  { id: 'pets', name: 'Pets' },
  { id: 'insurance', name: 'Insurance' },
  { id: 'investments', name: 'Investments' },
  { id: 'other', name: 'Other' },
];

export const mockExpenses: WithId<Expense>[] = [
  {
    id: uuidv4(),
    title: 'Groceries',
    amount: 75.5,
    date: subDays(new Date(), 2),
    categoryId: 'grocery',
  },
  {
    id: uuidv4(),
    title: 'Train Ticket',
    amount: 30.0,
    date: subDays(new Date(), 5),
    categoryId: 'transportation',
  },
  {
    id: uuidv4(),
    title: 'Movie Night',
    amount: 25.0,
    date: subDays(new Date(), 8),
    categoryId: 'entertainment',
  },
  {
    id: uuidv4(),
    title: 'New T-shirt',
    amount: 20.0,
    date: subDays(new Date(), 12),
    categoryId: 'clothing',
  },
  {
    id: uuidv4(),
    title: 'Electricity Bill',
    amount: 120.0,
    date: subDays(new Date(), 15),
    categoryId: 'utilities',
  },
   {
    id: uuidv4(),
    title: 'Dinner with Friends',
    amount: 60.0,
    date: subDays(new Date(), 1),
    categoryId: 'food',
  },
  {
    id: uuidv4(),
    title: 'Lunch',
    amount: 15.0,
    date: subMonths(new Date(), 1),
    categoryId: 'food',
  },
  {
    id: uuidv4(),
    title: 'Concert Tickets',
    amount: 150.0,
    date: subMonths(new Date(), 2),
    categoryId: 'entertainment',
  },
  {
    id: uuidv4(),
    title: 'Gas Bill',
    amount: 50.0,
    date: subMonths(new Date(), 3),
    categoryId: 'utilities',
  },
  {
    id: uuidv4(),
    title: 'Coffee',
    amount: 4.5,
    date: subMonths(new Date(), 4),
    categoryId: 'food',
  },
  {
    id: uuidv4(),
    title: 'Book',
    amount: 18.0,
    date: subMonths(new Date(), 5),
    categoryId: 'shopping',
  },
];


export const mockSavingsGoals: SavingsGoal[] = [
    {
        name: 'New Gaming PC',
        targetAmount: 2000,
        currentAmount: 750,
    },
     {
        name: 'Summer Vacation',
        targetAmount: 1500,
        currentAmount: 1400,
    }
];
