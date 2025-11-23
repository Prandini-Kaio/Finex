import React, { createContext, useContext, ReactNode } from 'react';
import type { Budget, BudgetData } from '../../types';
import type { BudgetFilters } from '../../services/api';
import { useBudgets } from '../../hooks';

interface BudgetContextType {
  budgets: Budget[];
  budgetData: BudgetData[];
  loading: boolean;
  error: string | null;
  addBudget: (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; data?: Budget; error?: string }>;
  updateBudget: (id: number, budgetData: Partial<Budget>) => Promise<{ success: boolean; data?: Budget; error?: string }>;
  deleteBudget: (id: number) => Promise<{ success: boolean; error?: string }>;
  calculateBudgetData: (transactions: any[], competency: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

interface BudgetProviderProps {
  children: ReactNode;
  filters?: BudgetFilters;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ 
  children, 
  filters = {} 
}) => {
  const budgetData = useBudgets(filters);

  return (
    <BudgetContext.Provider value={budgetData}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgetContext = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgetContext deve ser usado dentro de um BudgetProvider');
  }
  return context;
};
