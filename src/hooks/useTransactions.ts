import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Transaction, FinancialStats } from '../types';
import type { TransactionFilters } from '../services/api';
import { apiService } from '../services/api';

export const useTransactions = (filters: TransactionFilters = {}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FinancialStats | null>(null);

  // Memoiza os filtros para evitar recriação desnecessária
  const memoizedFilters = useMemo(() => filters, [
    filters.competency,
    filters.person,
    filters.category,
    filters.paymentType,
    filters.page,
    filters.limit,
  ]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.transactions.getAll(memoizedFilters);
      if (response.success) {
        setTransactions(response.data.data || []);
      } else {
        setError(response.message || 'Erro ao carregar transações');
        setTransactions([]);
      }
    } catch (err) {
      setError('Erro inesperado ao carregar transações');
      console.error('Erro ao carregar transações:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.transactions.getStats(memoizedFilters);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, [memoizedFilters]);

  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.transactions.create(transactionData);
      if (response.success) {
        await loadTransactions();
        await loadStats();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao criar transação');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao criar transação';
      setError(errorMsg);
      console.error('Erro ao criar transação:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadTransactions, loadStats]);

  const updateTransaction = useCallback(async (id: number, transactionData: Partial<Transaction>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.transactions.update(id, transactionData);
      if (response.success) {
        await loadTransactions();
        await loadStats();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao atualizar transação');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao atualizar transação';
      setError(errorMsg);
      console.error('Erro ao atualizar transação:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadTransactions, loadStats]);

  const deleteTransaction = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.transactions.delete(id);
      if (response.success) {
        await loadTransactions();
        await loadStats();
        return { success: true };
      } else {
        setError(response.message || 'Erro ao excluir transação');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao excluir transação';
      setError(errorMsg);
      console.error('Erro ao excluir transação:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadTransactions, loadStats]);

  useEffect(() => {
    loadTransactions();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedFilters]);

  return {
    transactions,
    stats,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: loadTransactions,
  };
};
