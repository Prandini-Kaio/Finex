import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export const useAppData = () => {
  const [closedMonths, setClosedMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClosedMonths = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.appData.getClosedMonths();
      if (response.success) {
        setClosedMonths(response.data);
      } else {
        setError(response.message || 'Erro ao carregar meses fechados');
      }
    } catch (err) {
      setError('Erro inesperado ao carregar meses fechados');
      console.error('Erro ao carregar meses fechados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addClosedMonth = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.appData.addClosedMonth(month);
      if (response.success) {
        setClosedMonths(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao fechar mês');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao fechar mês';
      setError(errorMsg);
      console.error('Erro ao fechar mês:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeClosedMonth = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.appData.removeClosedMonth(month);
      if (response.success) {
        setClosedMonths(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao reabrir mês');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao reabrir mês';
      setError(errorMsg);
      console.error('Erro ao reabrir mês:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const isMonthClosed = useCallback((month: string) => {
    return closedMonths.includes(month);
  }, [closedMonths]);

  useEffect(() => {
    loadClosedMonths();
  }, [loadClosedMonths]);

  return {
    closedMonths,
    loading,
    error,
    addClosedMonth,
    removeClosedMonth,
    isMonthClosed,
    refresh: loadClosedMonths,
  };
};
