import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.categories.getAll();
      if (response.success) {
        setCategories(response.data);
      } else {
        setError(response.message || 'Erro ao carregar categorias');
      }
    } catch (err) {
      setError('Erro inesperado ao carregar categorias');
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.categories.create(category);
      if (response.success) {
        await loadCategories();
        return { success: true, data: response.data };
      } else {
        setError(response.message || 'Erro ao criar categoria');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao criar categoria';
      setError(errorMsg);
      console.error('Erro ao criar categoria:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  const deleteCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.categories.delete(category);
      if (response.success) {
        await loadCategories();
        return { success: true };
      } else {
        setError(response.message || 'Erro ao excluir categoria');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMsg = 'Erro inesperado ao excluir categoria';
      setError(errorMsg);
      console.error('Erro ao excluir categoria:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    addCategory,
    deleteCategory,
    refresh: loadCategories,
  };
};
