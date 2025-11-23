import { BaseApiService } from './base';
import type { SavingsGoal, SavingsDeposit } from '../../types';
import type { SavingsGoalFilters, ISavingsGoalService, ApiResponse } from './types';

export class SavingsGoalService extends BaseApiService implements ISavingsGoalService {
  constructor() {
    super('savingsGoals');
  }

  async getAll(filters: SavingsGoalFilters = {}): Promise<ApiResponse<SavingsGoal[]>> {
    await this.delay();
    
    try {
      let data = await this.getFromStorage<SavingsGoal>();
      
      // Se não há dados no storage, retorna array vazio
      // A inicialização é feita pelo storageInitializer
      if (!data || data.length === 0) {
        data = [];
      }

      // Aplica filtros
      let filteredData = data;
      
      if (filters.owner) {
        filteredData = filteredData.filter(goal => goal.owner === filters.owner);
      }
      
      if (filters.status) {
        if (filters.status === 'active') {
          filteredData = filteredData.filter(goal => goal.currentAmount < goal.targetAmount);
        } else if (filters.status === 'completed') {
          filteredData = filteredData.filter(goal => goal.currentAmount >= goal.targetAmount);
        }
      }

      return this.createSuccessResponse(filteredData);
    } catch (error) {
      console.error('Erro ao buscar objetivos:', error);
      return this.createErrorResponse('Erro ao buscar objetivos');
    }
  }

  async getById(id: number): Promise<ApiResponse<SavingsGoal>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<SavingsGoal>();
      const goal = data.find(g => g.id === id);
      
      if (!goal) {
        return this.createErrorResponse('Objetivo não encontrado');
      }

      return this.createSuccessResponse(goal);
    } catch (error) {
      console.error('Erro ao buscar objetivo:', error);
      return this.createErrorResponse('Erro ao buscar objetivo');
    }
  }

  async create(goalData: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'deposits'>): Promise<ApiResponse<SavingsGoal>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<SavingsGoal>();
      
      const newGoal: SavingsGoal = {
        ...goalData,
        currentAmount: 0,
        deposits: [],
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedData = [...data, newGoal];
      await this.saveToStorage(updatedData);

      return this.createSuccessResponse(newGoal, 'Objetivo criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar objetivo:', error);
      return this.createErrorResponse('Erro ao criar objetivo');
    }
  }

  async update(id: number, goalData: Partial<SavingsGoal>): Promise<ApiResponse<SavingsGoal>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<SavingsGoal>();
      const index = data.findIndex(g => g.id === id);
      
      if (index === -1) {
        return this.createErrorResponse('Objetivo não encontrado');
      }

      const updatedGoal = {
        ...data[index],
        ...goalData,
        id,
        updatedAt: new Date().toISOString(),
      };

      data[index] = updatedGoal;
      await this.saveToStorage(data);

      return this.createSuccessResponse(updatedGoal, 'Objetivo atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar objetivo:', error);
      return this.createErrorResponse('Erro ao atualizar objetivo');
    }
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<SavingsGoal>();
      const filteredData = data.filter(g => g.id !== id);
      
      if (data.length === filteredData.length) {
        return this.createErrorResponse('Objetivo não encontrado');
      }

      await this.saveToStorage(filteredData);
      return this.createSuccessResponse(undefined, 'Objetivo excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir objetivo:', error);
      return this.createErrorResponse('Erro ao excluir objetivo');
    }
  }

  async addDeposit(goalId: number, deposit: { amount: number; date: string }): Promise<ApiResponse<SavingsGoal>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<SavingsGoal>();
      const index = data.findIndex(g => g.id === goalId);
      
      if (index === -1) {
        return this.createErrorResponse('Objetivo não encontrado');
      }

      const newDeposit: SavingsDeposit = {
        id: this.generateId(),
        amount: deposit.amount,
        date: deposit.date,
      };

      const updatedGoal = {
        ...data[index],
        deposits: [...data[index].deposits, newDeposit],
        currentAmount: data[index].currentAmount + deposit.amount,
        updatedAt: new Date().toISOString(),
      };

      data[index] = updatedGoal;
      await this.saveToStorage(data);

      return this.createSuccessResponse(updatedGoal, 'Depósito adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar depósito:', error);
      return this.createErrorResponse('Erro ao adicionar depósito');
    }
  }
}
