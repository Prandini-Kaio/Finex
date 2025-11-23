import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SavingsGoal, SavingsProjection, SavingsTrend } from '../types';
import type { SavingsGoalFilters } from '../services/api';
import { apiService } from '../services/api';

export const useSavingsGoals = (filters: SavingsGoalFilters = {}) => {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoiza os filtros para evitar recriação desnecessária
  const memoizedFilters = useMemo(() => filters, [
    filters.owner,
    filters.status
  ]);

  const loadSavingsGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.savingsGoals.getAll(memoizedFilters);
      if (response.success) {
        setSavingsGoals(response.data);
      } else {
        setError(response.message || 'Erro ao carregar objetivos');
        setSavingsGoals([]);
      }
    } catch (err) {
      setError('Erro inesperado ao carregar objetivos');
      console.error('Erro ao carregar objetivos:', err);
      setSavingsGoals([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  const addSavingsGoal = useCallback(async (goalData: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'deposits'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.savingsGoals.create(goalData);
      if (response.success) {
        await loadSavingsGoals();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao criar objetivo');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao criar objetivo';
      setError(errorMsg);
      console.error('Erro ao criar objetivo:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadSavingsGoals]);

  const updateSavingsGoal = useCallback(async (id: number, goalData: Partial<SavingsGoal>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.savingsGoals.update(id, goalData);
      if (response.success) {
        await loadSavingsGoals();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao atualizar objetivo');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao atualizar objetivo';
      setError(errorMsg);
      console.error('Erro ao atualizar objetivo:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadSavingsGoals]);

  const deleteSavingsGoal = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.savingsGoals.delete(id);
      if (response.success) {
        await loadSavingsGoals();
        return { success: true };
      } else {
        setError(response.message || 'Erro ao excluir objetivo');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao excluir objetivo';
      setError(errorMsg);
      console.error('Erro ao excluir objetivo:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadSavingsGoals]);

  const addDeposit = useCallback(async (goalId: number, deposit: { amount: number; date: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.savingsGoals.addDeposit(goalId, deposit);
      if (response.success) {
        await loadSavingsGoals();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao adicionar depósito');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao adicionar depósito';
      setError(errorMsg);
      console.error('Erro ao adicionar depósito:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadSavingsGoals]);

  // Calcula projeção de poupança
  const getProjection = useCallback((goal: SavingsGoal, avgMonthlySavings: number): SavingsProjection => {
    if (goal.currentAmount >= goal.targetAmount) {
      return { months: 0, status: 'completed' };
    }
    
    if (!goal.deadline) {
      return { months: null, status: 'no-deadline' };
    }
    
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsToDeadline = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30));
    const neededPerMonth = remaining / monthsToDeadline;
    
    if (avgMonthlySavings >= neededPerMonth) {
      return { months: Math.ceil(remaining / avgMonthlySavings), status: 'on-track' };
    } else {
      return { months: monthsToDeadline, status: 'behind', neededPerMonth };
    }
  }, []);

  // Calcula tendência de poupança
  const getSavingsTrend = useCallback((): SavingsTrend[] => {
    const last6Months: SavingsTrend[] = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      let monthSavings = 0;
      savingsGoals.forEach(goal => {
        const monthDeposits = goal.deposits.filter(d => {
          const depositDate = new Date(d.date);
          const depositMonth = `${String(depositDate.getMonth() + 1).padStart(2, '0')}/${depositDate.getFullYear()}`;
          return depositMonth === monthKey;
        });
        monthSavings += monthDeposits.reduce((sum, d) => sum + d.amount, 0);
      });
      
      last6Months.push({
        month: monthKey,
        saved: monthSavings
      });
    }
    
    return last6Months;
  }, [savingsGoals]);

  useEffect(() => {
    loadSavingsGoals();
  }, [loadSavingsGoals]);

  return {
    savingsGoals,
    loading,
    error,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addDeposit,
    getProjection,
    getSavingsTrend,
    refresh: loadSavingsGoals,
  };
};
