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
  creditCardId?: number // Campo do backend
  creditCardName?: string // Campo do backend
  installments: number
  installmentNumber: number
  totalInstallments: number
  parentPurchase?: number
}

export type TransactionPayload = Omit<Transaction, 'id'>

export type BudgetType = 'VALUE' | 'PERCENTAGE'

export interface Budget {
  id: number
  competency: string
  category: string
  person: Person
  budgetType: BudgetType
  amount: number
  percentage?: number
}

export type BudgetPayload = Omit<Budget, 'id'>

export interface CreditCard {
  id: number
  name: string
  owner: Person
  closingDay: string | number
  dueDay: string | number
  limit: number
}

export type CreditCardPayload = Omit<CreditCard, 'id'>

export interface CreditCardInvoiceStatus {
  creditCardId: number
  creditCardName: string
  owner: Person
  referenceMonth: string
  paid: boolean
  paidAt?: string | null
}

export interface CreditCardInvoicePayload {
  referenceMonth: string
  paid: boolean
}

export interface SavingsDeposit {
  id: number
  amount: number
  date: string
  person?: Person
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
  person: Person
}

export interface FinanceFilters {
  person: Person | 'Todos'
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
  owner: Person
  investedAmount: number
  investmentDate: string
  annualRate?: number
  currentValue?: number
  description?: string
  institution?: string
  createdAt: string
  updatedAt: string
}

export type InvestmentPayload = Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>

export interface FinanceState {
  transactions: Transaction[]
  budgets: Budget[]
  categories: string[]
  closedMonths: string[]
  creditCards: CreditCard[]
  savingsGoals: SavingsGoal[]
  recurringTransactions: RecurringTransaction[]
  investments: Investment[]
}




