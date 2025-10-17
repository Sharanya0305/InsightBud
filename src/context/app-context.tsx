'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { type Expense, type Category, type Budget, type SavingsGoal, type Rollover, WithId, Contribution } from '@/lib/types';
import { useCollection, useDoc, useUser, useFirestore, useAuth, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, addDoc, deleteDoc, serverTimestamp, where, query } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { categories as defaultCategories } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  expenses: WithId<Expense>[];
  categories: WithId<Category>[];
  budget: WithId<Budget> | null;
  savingsGoals: WithId<SavingsGoal>[];
  rollovers: WithId<Rollover>[];
  contributions: WithId<Contribution>[];
  justAccomplishedGoal: WithId<SavingsGoal> | null;
  loading: {
    expenses: boolean;
    categories: boolean;
    budget: boolean;
    savingsGoals: boolean;
    rollovers: boolean;
    contributions: boolean;
  };
  error: any;
}

type AppContextType = {
    state: AppState;
    addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => void;
    updateExpense: (expense: WithId<Expense>) => void;
    deleteExpense: (id: string) => void;
    setBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt'> & { createdAt?: Date }) => void;
    addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId'>) => void;
    updateSavingsGoal: (goal: WithId<SavingsGoal>) => void;
    deleteSavingsGoal: (id: string) => void;
    addContribution: (goalId: string, amount: number) => void;
    addRollover: (rollover: Omit<Rollover, 'id' | 'userId'>) => void;
    clearAccomplishedGoal: () => void;
    getCategoryNameById: (id: string) => string;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  
  // -- DATA FETCHING --
  const expensesQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/expenses`)) : null, [user, firestore]);
  const { data: expenses, isLoading: loadingExpenses } = useCollection<Expense>(expensesQuery);

  const categoriesQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/categories`)) : null, [user, firestore]);
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);

  const budgetQuery = useMemoFirebase(() => user ? doc(firestore, `users/${user.uid}/budgets/main`) : null, [user, firestore]);
  const { data: budget, isLoading: loadingBudget } = useDoc<Budget>(budgetQuery);

  const savingsGoalsQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/savingsGoals`)) : null, [user, firestore]);
  const { data: savingsGoals, isLoading: loadingSavingsGoals } = useCollection<SavingsGoal>(savingsGoalsQuery);
  
  const rolloversQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/rollovers`)) : null, [user, firestore]);
  const { data: rollovers, isLoading: loadingRollovers } = useCollection<Rollover>(rolloversQuery);
  
  const contributionsQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/contributions`)) : null, [user, firestore]);
  const { data: contributions, isLoading: loadingContributions } = useCollection<Contribution>(contributionsQuery);

  // -- SEEDING DEFAULT DATA --
  useEffect(() => {
    // This effect runs when categories have loaded for a user.
    if (user && categories) {
      const existingCategoryIds = new Set(categories.map(c => c.id));
      
      // Find which default categories are missing from the user's data.
      const missingCategories = defaultCategories.filter(
        defaultCat => !existingCategoryIds.has(defaultCat.id)
      );

      // If there are any missing categories, add them to Firestore.
      if (missingCategories.length > 0) {
        missingCategories.forEach(cat => {
          const docRef = doc(firestore, `users/${user.uid}/categories`, cat.id);
          setDocumentNonBlocking(docRef, { name: cat.name, userId: user.uid }, { merge: true });
        });
      }
    }
  }, [user, categories, firestore, loadingCategories]);
  
  const [justAccomplishedGoal, setJustAccomplishedGoal] = React.useState<WithId<SavingsGoal> | null>(null);

  // -- MUTATIONS --
  const addExpense = (expenseData: Omit<Expense, 'id' | 'userId'>) => {
    if (!user) return;
    const colRef = collection(firestore, `users/${user.uid}/expenses`);
    addDocumentNonBlocking(colRef, { ...expenseData, userId: user.uid });
  };
  
  const updateExpense = (expenseData: WithId<Expense>) => {
    if (!user) return;
    const docRef = doc(firestore, `users/${user.uid}/expenses`, expenseData.id);
    const { id, ...data } = expenseData;
    setDocumentNonBlocking(docRef, data, { merge: true });
  };

  const deleteExpense = (id: string) => {
    if (!user) return;
    const docRef = doc(firestore, `users/${user.uid}/expenses`, id);
    deleteDocumentNonBlocking(docRef);
  };
  
  const setBudget = (budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt'> & { createdAt?: Date }) => {
    if (!user) return;
    const docRef = doc(firestore, `users/${user.uid}/budgets`, 'main');
    
    // Add createdAt timestamp only if the budget is being created for the first time
    const dataToSet = budget?.amount
      ? { ...budgetData, userId: user.uid }
      : { ...budgetData, userId: user.uid, createdAt: new Date() };

    setDocumentNonBlocking(docRef, dataToSet, { merge: true });
  };
  
  const addSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'userId'>) => {
    if (!user) return;
    const colRef = collection(firestore, `users/${user.uid}/savingsGoals`);
    addDocumentNonBlocking(colRef, { ...goalData, userId: user.uid });
  };

  const updateSavingsGoal = (goalData: WithId<SavingsGoal>) => {
    if (!user) return;
    const docRef = doc(firestore, `users/${user.uid}/savingsGoals`, goalData.id);
    const { id, ...data } = goalData;
    setDocumentNonBlocking(docRef, data, { merge: true });
  };

  const deleteSavingsGoal = (id: string) => {
    if (!user) return;
    const docRef = doc(firestore, `users/${user.uid}/savingsGoals`, id);
    deleteDocumentNonBlocking(docRef);
  };
  
  const addContribution = (goalId: string, amount: number) => {
    if (!user || !savingsGoals) return;
    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal) return;

    // 1. Log the contribution as a separate document
    const colRef = collection(firestore, `users/${user.uid}/contributions`);
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      goalId: goalId,
      amount: amount,
      date: new Date().toISOString(),
    });


    // 2. Update the goal's current amount
    const wasCompleted = goal.currentAmount >= goal.targetAmount;
    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;
    
    if (isCompleted && !wasCompleted) {
        setJustAccomplishedGoal({ ...goal, currentAmount: newAmount });
    }

    const docRef = doc(firestore, `users/${user.uid}/savingsGoals`, goalId);
    updateDocumentNonBlocking(docRef, { currentAmount: newAmount });
  };
  
  const addRollover = (rolloverData: Omit<Rollover, 'id' | 'userId'>) => {
    if (!user) return;
    const colRef = collection(firestore, `users/${user.uid}/rollovers`);
    // Create a unique ID for each rollover event
    const newDocRef = doc(colRef);
    setDocumentNonBlocking(newDocRef, { ...rolloverData, id: newDocRef.id, userId: user.uid }, { merge: true });
  };
  
  const clearAccomplishedGoal = () => {
    setJustAccomplishedGoal(null);
  };

  const getCategoryNameById = (id: string) => {
    return categories?.find(c => c.id === id)?.name || 'N/A';
  }
  
  const state: AppState = {
    expenses: expenses || [],
    categories: categories || [],
    budget: budget as WithId<Budget> | null,
    savingsGoals: savingsGoals || [],
    rollovers: rollovers || [],
    contributions: contributions || [],
    justAccomplishedGoal,
    loading: {
      expenses: isUserLoading || loadingExpenses,
      categories: isUserLoading || loadingCategories,
      budget: isUserLoading || loadingBudget,
      savingsGoals: isUserLoading || loadingSavingsGoals,
      rollovers: isUserLoading || loadingRollovers,
      contributions: isUserLoading || loadingContributions,
    },
    error: null,
  };
  
  return (
    <AppContext.Provider value={{ state, addExpense, updateExpense, deleteExpense, setBudget, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addContribution, addRollover, clearAccomplishedGoal, getCategoryNameById }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
