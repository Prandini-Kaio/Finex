export type Person = 'Kaio' | 'Gabriela' | 'Ambos'

export type TransactionType = 'Despesa' | 'Receita'

export type PaymentMethod = 'Crédito' | 'Débito' | 'Dinheiro' | 'PIX'

export interface Transaction {
  id: number
  date: string
  type: TransactionType
  paymentMethod: PaymentMethod
  person: Person
  category: string
  description: string
  value: number
  competency: string
  creditCard?: string
  installments: number
  installmentNumber: number
  totalInstallments: number
  parentPurchase?: number
}

export type TransactionPayload = Omit<Transaction, 'id'>

export interface Budget {
  id: number
  competency: string
  category: string
  person: Person
  amount: number
}

export type BudgetPayload = Omit<Budget, 'id'>

export interface CreditCard {
  id: number
  name: string
  owner: Person
  closingDay: string
  dueDay: string
  limit: number
}

export type CreditCardPayload = Omit<CreditCard, 'id'>

export interface SavingsDeposit {
  id: number
  amount: number
  date: string
}

export interface SavingsGoal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  owner: Person
  description?: string
  deposits: SavingsDeposit[]
  createdAt: string
}

export type SavingsGoalPayload = Omit<SavingsGoal, 'id' | 'currentAmount' | 'deposits' | 'createdAt'>

export interface DepositPayload {
  goalId: number
  amount: number
  date: string
}

export interface FinanceFilters {
  person: Person | 'Todos'
  category: string | 'Todas'
  paymentType: PaymentMethod | 'Todos'
}

export interface SimulationResult {
  originalValue: number
  installments: number
  installmentValue: number
  totalWithInterest: number
  totalInterest: number
  interestRate: number
}

export interface RecurringTransaction {
  id: number
  description: string
  type: TransactionType
  paymentMethod: PaymentMethod
  person: Person
  category: string
  value: number
  startDate: string
  endDate?: string
  dayOfMonth: number
  creditCardId?: number
  creditCardName?: string
  active: boolean
  baseCompetency?: string
}

export type RecurringTransactionPayload = Omit<RecurringTransaction, 'id' | 'creditCardName'>

export interface FinanceState {
  transactions: Transaction[]
  budgets: Budget[]
  categories: string[]
  closedMonths: string[]
  creditCards: CreditCard[]
  savingsGoals: SavingsGoal[]
  recurringTransactions: RecurringTransaction[]
}




