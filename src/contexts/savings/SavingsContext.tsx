import React, { createContext, useContext, type ReactNode } from 'react';
import type { SavingsGoal, SavingsProjection, SavingsTrend } from '../../types';
import type { SavingsGoalFilters } from '../../services/api';
import { useSavingsGoals } from '../../hooks';

interface SavingsContextType {
  savingsGoals: SavingsGoal[];
  loading: boolean;
  error: string | null;
  addSavingsGoal: (goalData: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'deposits'>) => Promise<{ success: boolean; data?: SavingsGoal; error?: string }>;
  updateSavingsGoal: (id: number, goalData: Partial<SavingsGoal>) => Promise<{ success: boolean; data?: SavingsGoal; error?: string }>;
  deleteSavingsGoal: (id: number) => Promise<{ success: boolean; error?: string }>;
  addDeposit: (goalId: number, deposit: { amount: number; date: string }) => Promise<{ success: boolean; data?: SavingsGoal; error?: string }>;
  getProjection: (goal: SavingsGoal, avgMonthlySavings: number) => SavingsProjection;
  getSavingsTrend: () => SavingsTrend[];
  refresh: () => Promise<void>;
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

interface SavingsProviderProps {
  children: ReactNode;
  filters?: SavingsGoalFilters;
}

export const SavingsProvider: React.FC<SavingsProviderProps> = ({ 
  children, 
  filters = {} 
}) => {
  const savingsData = useSavingsGoals(filters);

  return (
    <SavingsContext.Provider value={savingsData}>
      {children}
    </SavingsContext.Provider>
  );
};

export const useSavingsContext = (): SavingsContextType => {
  const context = useContext(SavingsContext);
  if (!context) {
    throw new Error('useSavingsContext deve ser usado dentro de um SavingsProvider');
  }
  return context;
};
