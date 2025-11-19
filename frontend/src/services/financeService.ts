import type {
  Budget,
  BudgetPayload,
  CreditCard,
  CreditCardPayload,
  DepositPayload,
  SavingsGoal,
  SavingsGoalPayload,
  Transaction,
  TransactionPayload,
} from '../types/finance'
import { httpClient } from './httpClient'

export const financeService = {
  getTransactions(): Promise<Transaction[]> {
    return httpClient<Transaction[]>('/api/transactions')
  },
  createTransaction(payload: TransactionPayload): Promise<Transaction> {
    return httpClient<Transaction>('/api/transactions', {
      method: 'POST',
      body: payload,
    })
  },
  deleteTransaction(id: number): Promise<void> {
    return httpClient<void>(`/api/transactions/${id}`, {
      method: 'DELETE',
    })
  },
  getBudgets(): Promise<Budget[]> {
    return httpClient<Budget[]>('/api/budgets')
  },
  createBudget(payload: BudgetPayload): Promise<Budget> {
    return httpClient<Budget>('/api/budgets', {
      method: 'POST',
      body: payload,
    })
  },
  deleteBudget(id: number): Promise<void> {
    return httpClient<void>(`/api/budgets/${id}`, {
      method: 'DELETE',
    })
  },
  getCategories(): Promise<string[]> {
    return httpClient<string[]>('/api/categories')
  },
  async saveCategories(categories: string[]): Promise<string[]> {
    return httpClient<string[]>('/api/categories', {
      method: 'PUT',
      body: categories,
    })
  },
  getClosedMonths(): Promise<string[]> {
    return httpClient<string[]>('/api/closed-months')
  },
  async closeMonth(month: string): Promise<string[]> {
    return httpClient<string[]>('/api/closed-months', {
      method: 'POST',
      body: { month },
    })
  },
  async reopenMonth(month: string): Promise<string[]> {
    return httpClient<string[]>(`/api/closed-months/${month}`, {
      method: 'DELETE',
    })
  },
  getCreditCards(): Promise<CreditCard[]> {
    return httpClient<CreditCard[]>('/api/credit-cards')
  },
  createCreditCard(payload: CreditCardPayload): Promise<CreditCard> {
    return httpClient<CreditCard>('/api/credit-cards', {
      method: 'POST',
      body: payload,
    })
  },
  deleteCreditCard(id: number): Promise<void> {
    return httpClient<void>(`/api/credit-cards/${id}`, {
      method: 'DELETE',
    })
  },
  getSavingsGoals(): Promise<SavingsGoal[]> {
    return httpClient<SavingsGoal[]>('/api/savings-goals')
  },
  createSavingsGoal(payload: SavingsGoalPayload): Promise<SavingsGoal> {
    return httpClient<SavingsGoal>('/api/savings-goals', {
      method: 'POST',
      body: payload,
    })
  },
  deleteSavingsGoal(id: number): Promise<void> {
    return httpClient<void>(`/api/savings-goals/${id}`, {
      method: 'DELETE',
    })
  },
  async addDeposit(payload: DepositPayload): Promise<SavingsGoal> {
    return httpClient<SavingsGoal>(`/api/savings-goals/${payload.goalId}/deposits`, {
      method: 'POST',
      body: payload,
    })
  },
}

