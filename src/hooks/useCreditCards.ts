import { useState, useEffect, useCallback } from 'react';
import type { CreditCard } from '../types';
import { apiService } from '../services/api';

export const useCreditCards = () => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCreditCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.creditCards.getAll();
      if (response.success) {
        setCreditCards(response.data);
      } else {
        setError(response.message || 'Erro ao carregar cartões');
      }
    } catch (err) {
      setError('Erro inesperado ao carregar cartões');
      console.error('Erro ao carregar cartões:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCreditCard = useCallback(async (cardData: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.creditCards.create(cardData);
      if (response.success) {
        await loadCreditCards();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao criar cartão');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao criar cartão';
      setError(errorMsg);
      console.error('Erro ao criar cartão:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadCreditCards]);

  const updateCreditCard = useCallback(async (id: number, cardData: Partial<CreditCard>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.creditCards.update(id, cardData);
      if (response.success) {
        await loadCreditCards();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao atualizar cartão');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao atualizar cartão';
      setError(errorMsg);
      console.error('Erro ao atualizar cartão:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadCreditCards]);

  const deleteCreditCard = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.creditCards.delete(id);
      if (response.success) {
        await loadCreditCards();
        return { success: true };
      } else {
        setError(response.message || 'Erro ao excluir cartão');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao excluir cartão';
      setError(errorMsg);
      console.error('Erro ao excluir cartão:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadCreditCards]);

  useEffect(() => {
    loadCreditCards();
  }, [loadCreditCards]);

  return {
    creditCards,
    loading,
    error,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    refresh: loadCreditCards,
  };
};
