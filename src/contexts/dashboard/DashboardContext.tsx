import React, { createContext, useContext, type ReactNode } from 'react';
import type { FinancialStats, SavingsGoal, SavingsTrend } from '../../types';
import { useTransactions, useSavingsGoals } from '../../hooks';

interface DashboardContextType {
  stats: FinancialStats | null;
  savingsGoals: SavingsGoal[];
  savingsTrend: SavingsTrend[];
  totalSaved: number;
  totalGoals: number;
  savingsPercentage: number;
  avgMonthlySavings: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
  selectedMonth: string;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ 
  children, 
  selectedMonth 
}) => {
  const { stats, loading: transactionsLoading, error: transactionsError, refresh: refreshTransactions } = useTransactions({
    competency: selectedMonth
  });
  
  const { 
    savingsGoals, 
    loading: savingsLoading, 
    error: savingsError, 
    getSavingsTrend,
    refresh: refreshSavings 
  } = useSavingsGoals();

  const loading = transactionsLoading || savingsLoading;
  const error = transactionsError || savingsError;

  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalGoals = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const savingsPercentage = totalGoals > 0 ? (totalSaved / totalGoals) * 100 : 0;
  
  const savingsTrend = getSavingsTrend();
  const avgMonthlySavings = savingsTrend.length > 0 
    ? savingsTrend.reduce((sum, month) => sum + month.saved, 0) / savingsTrend.length 
    : 0;

  const refresh = async () => {
    await Promise.all([refreshTransactions(), refreshSavings()]);
  };

  const value: DashboardContextType = {
    stats,
    savingsGoals,
    savingsTrend,
    totalSaved,
    totalGoals,
    savingsPercentage,
    avgMonthlySavings,
    loading,
    error,
    refresh
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext deve ser usado dentro de um DashboardProvider');
  }
  return context;
};
