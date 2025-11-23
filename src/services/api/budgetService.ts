import { BaseApiService } from './base';
import type { Budget } from '../../types';
import type { BudgetFilters, IBudgetService, ApiResponse } from './types';

export class BudgetService extends BaseApiService implements IBudgetService {
  constructor() {
    super('budgets');
  }

  async getAll(filters: BudgetFilters = {}): Promise<ApiResponse<Budget[]>> {
    await this.delay();
    
    try {
      let data = await this.getFromStorage<Budget>();
      
      // Se não há dados no storage, retorna array vazio
      // A inicialização é feita pelo storageInitializer
      if (!data || data.length === 0) {
        data = [];
      }

      // Aplica filtros
      const filteredData = this.applyFilters(data, filters);

      return this.createSuccessResponse(filteredData);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      return this.createErrorResponse('Erro ao buscar orçamentos');
    }
  }

  async getById(id: number): Promise<ApiResponse<Budget>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Budget>();
      const budget = data.find(b => b.id === id);
      
      if (!budget) {
        return this.createErrorResponse('Orçamento não encontrado');
      }

      return this.createSuccessResponse(budget);
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      return this.createErrorResponse('Erro ao buscar orçamento');
    }
  }

  async create(budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Budget>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Budget>();
      
      const newBudget: Budget = {
        ...budgetData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedData = [...data, newBudget];
      await this.saveToStorage(updatedData);

      return this.createSuccessResponse(newBudget, 'Orçamento criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      return this.createErrorResponse('Erro ao criar orçamento');
    }
  }

  async update(id: number, budgetData: Partial<Budget>): Promise<ApiResponse<Budget>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Budget>();
      const index = data.findIndex(b => b.id === id);
      
      if (index === -1) {
        return this.createErrorResponse('Orçamento não encontrado');
      }

      const updatedBudget = {
        ...data[index],
        ...budgetData,
        id,
        updatedAt: new Date().toISOString(),
      };

      data[index] = updatedBudget;
      await this.saveToStorage(data);

      return this.createSuccessResponse(updatedBudget, 'Orçamento atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return this.createErrorResponse('Erro ao atualizar orçamento');
    }
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<Budget>();
      const filteredData = data.filter(b => b.id !== id);
      
      if (data.length === filteredData.length) {
        return this.createErrorResponse('Orçamento não encontrado');
      }

      await this.saveToStorage(filteredData);
      return this.createSuccessResponse(undefined, 'Orçamento excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      return this.createErrorResponse('Erro ao excluir orçamento');
    }
  }
}
