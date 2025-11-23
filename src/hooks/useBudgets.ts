import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Budget, BudgetData } from '../types';
import type { BudgetFilters } from '../services/api';
import { apiService } from '../services/api';

export const useBudgets = (filters: BudgetFilters = {}) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoiza os filtros para evitar recriação desnecessária
  const memoizedFilters = useMemo(() => filters, [
    filters.competency,
    filters.person,
    filters.category
  ]);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.budgets.getAll(memoizedFilters);
      if (response.success) {
        setBudgets(response.data);
      } else {
        setError(response.message || 'Erro ao carregar orçamentos');
        setBudgets([]);
      }
    } catch (err) {
      setError('Erro inesperado ao carregar orçamentos');
      console.error('Erro ao carregar orçamentos:', err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  const addBudget = useCallback(async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.budgets.create(budgetData);
      if (response.success) {
        await loadBudgets();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao criar orçamento');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao criar orçamento';
      setError(errorMsg);
      console.error('Erro ao criar orçamento:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadBudgets]);

  const updateBudget = useCallback(async (id: number, budgetData: Partial<Budget>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.budgets.update(id, budgetData);
      if (response.success) {
        await loadBudgets();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao atualizar orçamento');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao atualizar orçamento';
      setError(errorMsg);
      console.error('Erro ao atualizar orçamento:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadBudgets]);

  const deleteBudget = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.budgets.delete(id);
      if (response.success) {
        await loadBudgets();
        return { success: true };
      } else {
        setError(response.message || 'Erro ao excluir orçamento');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao excluir orçamento';
      setError(errorMsg);
      console.error('Erro ao excluir orçamento:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadBudgets]);

  // Calcula dados de orçamento com gastos reais automaticamente
  const calculateBudgetData = useCallback(async (transactions: any[], competency: string) => {
    try {
      const monthBudgets = budgets.filter(b => b.competency === competency);
      
      const data = monthBudgets.map(budget => {
        const spent = transactions
          .filter(t => t.type === 'Despesa' && t.category === budget.category && t.person === budget.person)
          .reduce((sum, t) => sum + t.value, 0);
        
        const difference = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        return {
          ...budget,
          spent,
          difference,
          percentage
        };
      });
      
      setBudgetData(data);
    } catch (err) {
      console.error('Erro ao calcular dados de orçamento:', err);
    }
  }, [budgets]);

  // Calcula budgetData automaticamente quando budgets ou filters mudarem
  useEffect(() => {
    // Não calcula enquanto está carregando
    if (loading) {
      return;
    }
    
    const calculateData = async () => {
      if (budgets.length > 0 && memoizedFilters.competency) {
        try {
          // Busca transações do mês filtrado
          const transactionsResponse = await apiService.transactions.getAll({
            competency: memoizedFilters.competency
          });
          
          if (transactionsResponse.success) {
            const transactions = transactionsResponse.data.data || [];
            const monthBudgets = budgets.filter(b => b.competency === memoizedFilters.competency);
            
            const data = monthBudgets.map(budget => {
              const spent = transactions
                .filter(t => t.type === 'Despesa' && t.category === budget.category && t.person === budget.person)
                .reduce((sum, t) => sum + t.value, 0);
              
              const difference = budget.amount - spent;
              const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
              
              return {
                ...budget,
                spent,
                difference,
                percentage
              };
            });
            
            setBudgetData(data);
          }
        } catch (err) {
          console.error('Erro ao buscar transações para cálculo:', err);
          // Se não conseguir buscar transações, apenas mostra os budgets sem cálculos
          const monthBudgets = budgets.filter(b => b.competency === memoizedFilters.competency);
          const data = monthBudgets.map(budget => ({
            ...budget,
            spent: 0,
            difference: budget.amount,
            percentage: 0
          }));
          setBudgetData(data);
        }
      } else if (budgets.length > 0 && !memoizedFilters.competency) {
        // Se não há filtro de competência, mostra todos os budgets sem cálculos
        const data = budgets.map(budget => ({
          ...budget,
          spent: 0,
          difference: budget.amount,
          percentage: 0
        }));
        setBudgetData(data);
      } else {
        setBudgetData([]);
      }
    };

    calculateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets.length, memoizedFilters.competency, loading]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return {
    budgets,
    budgetData,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    calculateBudgetData,
    refresh: loadBudgets,
  };
};
