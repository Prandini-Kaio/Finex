import type { ApiResponse } from '../../types';
import type { PaginatedResponse } from './types';

// Classe base para serviços da API
export abstract class BaseApiService {
  protected baseUrl: string;
  protected storageKey: string;

  constructor(storageKey: string) {
    this.baseUrl = '/api'; // Para futuras implementações com backend real
    this.storageKey = storageKey;
  }

  // Método para simular delay de rede
  protected async delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para ler dados do localStorage
  protected async getFromStorage<T>(): Promise<T[]> {
    try {
      const result = await window.storage.get(this.storageKey);
      return result ? JSON.parse(result.value) : [];
    } catch (error) {
      console.error(`Erro ao ler dados do storage (${this.storageKey}):`, error);
      return [];
    }
  }

  // Método para salvar dados no localStorage
  protected async saveToStorage<T>(data: T[]): Promise<void> {
    try {
      await window.storage.set(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Erro ao salvar dados no storage (${this.storageKey}):`, error);
      throw error;
    }
  }

  // Método para gerar ID único
  protected generateId(): number {
    return Date.now() + Math.random();
  }

  // Método para criar resposta de sucesso
  protected createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      data,
      success: true,
      message,
    };
  }

  // Método para criar resposta de erro
  protected createErrorResponse<T>(message: string): ApiResponse<T> {
    return {
      data: null as T,
      success: false,
      message,
    };
  }

  // Método para criar resposta paginada
  protected createPaginatedResponse<T>(
    data: T[],
    page: number = 1,
    limit: number = 10
  ): PaginatedResponse<T> {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);
    const total = data.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Método para aplicar filtros
  protected applyFilters<T>(
    data: T[],
    filters: Record<string, any>
  ): T[] {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return true;
        }
        
        const itemValue = (item as any)[key];
        
        if (typeof value === 'string' && typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }
        
        return itemValue === value;
      });
    });
  }
}
