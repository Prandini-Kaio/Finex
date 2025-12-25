export interface Person {
  id: number
  name: string
  active: boolean
  allowSplit: boolean
  splitWithPersonIds?: number[]
}

export type TransactionType = 'Despesa' | 'Receita'

export type PaymentMethod = 'Crédito' | 'Débito' | 'Dinheiro' | 'PIX'

export interface Transaction {
  id: number
  date: string
  type: TransactionType
  paymentMethod: PaymentMethod
  person: string
  category: string
  description: string
  value: number
  competency: string
  creditCard?: string
  creditCardId?: number // Campo do backend
  creditCardName?: string // Campo do backend
  installments: number
  installmentNumber: number
  totalInstallments: number
  parentPurchase?: number
}

export type TransactionPayload = Omit<Transaction, 'id' | 'person'> & { personId: number }

export type BudgetType = 'VALUE' | 'PERCENTAGE'

export interface Budget {
  id: number
  competency: string
  category: string
  person: string
  budgetType: BudgetType
  amount: number
  percentage?: number
}

export type BudgetPayload = Omit<Budget, 'id' | 'person'> & { personId: number }

export interface CreditCard {
  id: number
  name: string
  owner: string
  closingDay: string | number
  dueDay: string | number
  limit: number
}

export type CreditCardPayload = Omit<CreditCard, 'id' | 'owner'> & { ownerId: number }

export interface CreditCardInvoiceStatus {
  creditCardId: number
  creditCardName: string
  owner: string
  referenceMonth: string
  paid: boolean
  paidAt?: string | number[] | null
}

export interface CreditCardInvoicePayload {
  referenceMonth: string
  paid: boolean
}

export interface SavingsDeposit {
  id: number
  amount: number
  date: string
  person?: string
  observacao?: string
}

export interface SavingsGoal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  owner: string
  description?: string
  deposits: SavingsDeposit[]
  createdAt: string
}

export type SavingsGoalPayload = Omit<SavingsGoal, 'id' | 'currentAmount' | 'deposits' | 'createdAt' | 'owner'> & { ownerId: number }

export interface DepositPayload {
  goalId: number
  amount: number
  date: string
  personId: number
  observacao?: string
}

export interface FinanceFilters {
  person: string | 'Todos'
  category: string | 'Todas'
  paymentType: PaymentMethod | 'Todos'
  creditCard: string | 'Todos'
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
  person: string
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

export type RecurringTransactionPayload = Omit<RecurringTransaction, 'id' | 'creditCardName' | 'person'> & { personId: number }

export type InvestmentType = 
  | 'TESOURO_DIRETO'
  | 'CDB'
  | 'POUPANCA'
  | 'LCI'
  | 'LCA'
  | 'FUNDO_INVESTIMENTO'
  | 'ACAO'
  | 'FII'
  | 'OUTROS'

export interface Investment {
  id: number
  name: string
  type: InvestmentType
  owner: string
  investedAmount: number
  investmentDate: string
  annualRate?: number
  currentValue?: number
  description?: string
  institution?: string
  createdAt: string
  updatedAt: string
}

export type InvestmentPayload = Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'owner'> & { ownerId: number }

export interface FinanceState {
  transactions: Transaction[]
  budgets: Budget[]
  categories: string[]
  closedMonths: string[]
  creditCards: CreditCard[]
  savingsGoals: SavingsGoal[]
  recurringTransactions: RecurringTransaction[]
  investments: Investment[]
  persons: Person[]
}




