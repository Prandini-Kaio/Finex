import { BaseApiService } from './base';
import type { Transaction, FinancialStats } from '../../types';
import type { TransactionFilters, ITransactionService, ApiResponse, PaginatedResponse } from './types';

export class TransactionService extends BaseApiService implements ITransactionService {
  constructor() {
    super('transactions');
  }

  async getAll(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    await this.delay();
    
    try {
      let data = await this.getFromStorage<Transaction>();
      
      // Se não há dados no storage, retorna array vazio
      // A inicialização é feita pelo storageInitializer
      if (!data || data.length === 0) {
        data = [];
      }

      // Aplica filtros
      const filteredData = this.applyFilters(data, filters);

      return this.createPaginatedResponse(
        filteredData,
        filters.page || 1,
        filters.limit || 50
      );
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return this.createPaginatedResponse([]);
    }
  }

  async getById(id: number): Promise<ApiResponse<Transaction>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Transaction>();
      const transaction = data.find(t => t.id === id);
      
      if (!transaction) {
        return this.createErrorResponse('Transação não encontrada');
      }

      return this.createSuccessResponse(transaction);
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      return this.createErrorResponse('Erro ao buscar transação');
    }
  }

  async create(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Transaction>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Transaction>();
      
      const newTransaction: Transaction = {
        ...transactionData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedData = [...data, newTransaction];
      await this.saveToStorage(updatedData);

      return this.createSuccessResponse(newTransaction, 'Transação criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return this.createErrorResponse('Erro ao criar transação');
    }
  }

  async update(id: number, transactionData: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Transaction>();
      const index = data.findIndex(t => t.id === id);
      
      if (index === -1) {
        return this.createErrorResponse('Transação não encontrada');
      }

      const updatedTransaction = {
        ...data[index],
        ...transactionData,
        id,
        updatedAt: new Date().toISOString(),
      };

      data[index] = updatedTransaction;
      await this.saveToStorage(data);

      return this.createSuccessResponse(updatedTransaction, 'Transação atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return this.createErrorResponse('Erro ao atualizar transação');
    }
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Transaction>();
      const filteredData = data.filter(t => t.id !== id);
      
      if (data.length === filteredData.length) {
        return this.createErrorResponse('Transação não encontrada');
      }

      await this.saveToStorage(filteredData);
      return this.createSuccessResponse(undefined, 'Transação excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      return this.createErrorResponse('Erro ao excluir transação');
    }
  }

  async getStats(filters: TransactionFilters = {}): Promise<ApiResponse<FinancialStats>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Transaction>();
      const filteredData = this.applyFilters(data, filters);

      const expenses = filteredData
        .filter(t => t.type === 'Despesa')
        .reduce((sum, t) => sum + t.value, 0);

      const income = filteredData
        .filter(t => t.type === 'Receita')
        .reduce((sum, t) => sum + t.value, 0);

      const byCategory: Record<string, number> = {};
      filteredData
        .filter(t => t.type === 'Despesa')
        .forEach(t => {
          byCategory[t.category] = (byCategory[t.category] || 0) + t.value;
        });

      const byPerson = {
        Kaio: filteredData
          .filter(t => t.person === 'Kaio' && t.type === 'Despesa')
          .reduce((sum, t) => sum + t.value, 0),
        Gabriela: filteredData
          .filter(t => t.person === 'Gabriela' && t.type === 'Despesa')
          .reduce((sum, t) => sum + t.value, 0),
        Ambos: filteredData
          .filter(t => t.person === 'Ambos' && t.type === 'Despesa')
          .reduce((sum, t) => sum + t.value, 0),
      };

      const stats: FinancialStats = {
        expenses,
        income,
        balance: income - expenses,
        byCategory,
        byPerson,
      };

      return this.createSuccessResponse(stats);
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return this.createErrorResponse('Erro ao calcular estatísticas');
    }
  }
}
