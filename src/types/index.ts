// Tipos base do sistema
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Tipos para transações
export interface Transaction extends BaseEntity {
  date: string;
  type: 'Despesa' | 'Receita';
  paymentMethod: 'Crédito' | 'Débito' | 'Dinheiro' | 'PIX';
  person: 'Kaio' | 'Gabriela' | 'Ambos';
  category: string;
  description: string;
  value: number;
  competency: string; // MM/AAAA
  creditCard?: number; // ID do cartão
  installments: number;
  installmentNumber: number;
  totalInstallments?: number;
  parentPurchase?: number; // ID da compra original para parcelas
}

// Tipos para orçamentos
export interface Budget extends BaseEntity {
  competency: string; // MM/AAAA
  category: string;
  person: 'Kaio' | 'Gabriela' | 'Ambos';
  amount: number;
}

// Tipos para cartões de crédito
export interface CreditCard extends BaseEntity {
  name: string;
  owner: 'Kaio' | 'Gabriela' | 'Ambos';
  closingDay: number;
  dueDay: number;
  limit: number;
}

// Tipos para objetivos de poupança
export interface SavingsGoal extends BaseEntity {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  owner: 'Kaio' | 'Gabriela' | 'Ambos';
  description: string;
  deposits: SavingsDeposit[];
}

export interface SavingsDeposit {
  id: number;
  amount: number;
  date: string;
}

// Tipos para filtros
export interface TransactionFilters {
  person: string;
  category: string;
  paymentType: string;
}

// Tipos para estatísticas
export interface FinancialStats {
  expenses: number;
  income: number;
  balance: number;
  byCategory: Record<string, number>;
  byPerson: {
    Kaio: number;
    Gabriela: number;
    Ambos: number;
  };
}

// Tipos para dados de orçamento
export interface BudgetData extends Budget {
  spent: number;
  difference: number;
  percentage: number;
}

// Tipos para dados históricos
export interface HistoricalData {
  month: string;
  expenses: number;
  income: number;
  budget: number;
  balance: number;
}

// Tipos para dados de burndown
export interface BurndownData {
  day: number;
  spent: number;
  budget: number;
  remaining: number;
}

// Tipos para tendência de categoria
export interface CategoryTrend {
  month: string;
  [category: string]: string | number;
}

// Tipos para saúde financeira
export interface HealthScore {
  score: number;
  label: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
}

// Tipos para projeção de poupança
export interface SavingsProjection {
  months: number | null;
  status: 'on-track' | 'behind' | 'completed' | 'no-deadline';
  neededPerMonth?: number;
}

// Tipos para dados de tendência de poupança
export interface SavingsTrend {
  month: string;
  saved: number;
}

// Tipos para formulários
export interface TransactionForm {
  date: string;
  type: 'Despesa' | 'Receita';
  paymentMethod: 'Crédito' | 'Débito' | 'Dinheiro' | 'PIX';
  person: 'Kaio' | 'Gabriela' | 'Ambos';
  category: string;
  description: string;
  value: string;
  competency: string;
  creditCard: string;
  installments: string;
  installmentNumber: number;
}

export interface BudgetForm {
  competency: string;
  category: string;
  person: 'Kaio' | 'Gabriela' | 'Ambos';
  amount: string;
}

export interface CreditCardForm {
  name: string;
  owner: 'Kaio' | 'Gabriela' | 'Ambos';
  closingDay: string;
  dueDay: string;
  limit: string;
}

export interface SavingsGoalForm {
  name: string;
  targetAmount: string;
  deadline: string;
  owner: 'Kaio' | 'Gabriela' | 'Ambos';
  description: string;
}

export interface DepositForm {
  amount: string;
  date: string;
}

// Tipos para views/estados da aplicação
export type ViewType = 'dashboard' | 'transactions' | 'closure' | 'budget' | 'savings' | 'settings';

export interface AppState {
  activeView: ViewType;
  selectedMonth: string;
  filters: TransactionFilters;
  closedMonths: string[];
  categories: string[];
}

// Tipos para modais
export interface ModalState {
  showTransactionModal: boolean;
  showBudgetModal: boolean;
  showCardModal: boolean;
  showSavingsModal: boolean;
  showDepositModal: boolean;
  selectedGoal: SavingsGoal | null;
}

// Tipos para API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
