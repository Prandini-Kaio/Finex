import type { 
  Transaction, 
  Budget, 
  CreditCard, 
  SavingsGoal, 
  ApiResponse
} from '../../types';

// Tipos específicos para a API
export interface TransactionFilters {
  person?: string;
  category?: string;
  paymentType?: string;
  competency?: string;
  page?: number;
  limit?: number;
}

export interface BudgetFilters {
  competency?: string;
  person?: string;
  category?: string;
}

export interface SavingsGoalFilters {
  owner?: string;
  status?: 'active' | 'completed';
}

// Tipos para API
export type { ApiResponse } from '../../types';

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interfaces para os serviços
export interface ITransactionService {
  getAll(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>>;
  getById(id: number): Promise<ApiResponse<Transaction>>;
  create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Transaction>>;
  update(id: number, transaction: Partial<Transaction>): Promise<ApiResponse<Transaction>>;
  delete(id: number): Promise<ApiResponse<void>>;
  getStats(filters?: TransactionFilters): Promise<ApiResponse<any>>;
}

export interface IBudgetService {
  getAll(filters?: BudgetFilters): Promise<ApiResponse<Budget[]>>;
  getById(id: number): Promise<ApiResponse<Budget>>;
  create(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Budget>>;
  update(id: number, budget: Partial<Budget>): Promise<ApiResponse<Budget>>;
  delete(id: number): Promise<ApiResponse<void>>;
}

export interface ICreditCardService {
  getAll(): Promise<ApiResponse<CreditCard[]>>;
  getById(id: number): Promise<ApiResponse<CreditCard>>;
  create(card: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CreditCard>>;
  update(id: number, card: Partial<CreditCard>): Promise<ApiResponse<CreditCard>>;
  delete(id: number): Promise<ApiResponse<void>>;
}

export interface ISavingsGoalService {
  getAll(filters?: SavingsGoalFilters): Promise<ApiResponse<SavingsGoal[]>>;
  getById(id: number): Promise<ApiResponse<SavingsGoal>>;
  create(goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'deposits'>): Promise<ApiResponse<SavingsGoal>>;
  update(id: number, goal: Partial<SavingsGoal>): Promise<ApiResponse<SavingsGoal>>;
  delete(id: number): Promise<ApiResponse<void>>;
  addDeposit(goalId: number, deposit: { amount: number; date: string }): Promise<ApiResponse<SavingsGoal>>;
}

export interface ICategoryService {
  getAll(): Promise<ApiResponse<string[]>>;
  create(category: string): Promise<ApiResponse<string>>;
  delete(category: string): Promise<ApiResponse<void>>;
}

export interface IAppDataService {
  getClosedMonths(): Promise<ApiResponse<string[]>>;
  addClosedMonth(month: string): Promise<ApiResponse<string[]>>;
  removeClosedMonth(month: string): Promise<ApiResponse<string[]>>;
}
