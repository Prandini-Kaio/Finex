export interface Person {
  id: number
  name: string
  active: boolean
  allowSplit: boolean
  splits?: Array<{ splitWithPersonId: number; percentage: number }>
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
  bankAccountId?: number
  bankAccountName?: string
  installments: number
  installmentNumber: number
  totalInstallments: number
  parentPurchase?: number
}

export type TransactionPayload = Omit<Transaction, 'id' | 'person'> & { personId: number; bankAccountId?: number }

export type InstallmentGroupCommonFieldsPayload = {
  personId: number
  type: TransactionType
  paymentMethod: PaymentMethod
  creditCardId?: number
  category: string
  description: string
}

export type UpdateInstallmentsPayload = {
  newTotalValue?: number
  newPurchaseDate?: string
  newTotalInstallments?: number
}

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
  ownerId?: number
  referenceMonth: string
  paid: boolean
  paidAt?: string | number[] | null
  invoiceAmount?: number
  paymentTransactionId?: number | null
  bankAccountId?: number | null
  bankAccountName?: string | null
}

export interface CreditCardInvoicePayload {
  referenceMonth: string
  paid: boolean
  bankAccountId?: number | null
}

export interface PayAllCreditCardInvoicesPayload {
  referenceMonth: string
  paid: boolean
  bankAccountIdByCardId?: Record<number, number>
}

export interface CreditCardInvoiceReceipt {
  creditCardId: number
  creditCardName: string
  owner: string
  referenceMonth: string
  invoiceAmount: number
  paidAt?: string | null
  paymentTransactionId?: number | null
  bankAccountId?: number | null
  bankAccountName?: string | null
  accountBalanceAfterPayment?: number | null
  paymentDate?: string | null
  description?: string | null
}

export interface BankAccount {
  id: number
  name: string
  institution?: string
  owner: string
  ownerId: number
  initialBalance: number
  currentBalance: number
  active: boolean
}

export type BankAccountPayload = Omit<BankAccount, 'id' | 'owner' | 'currentBalance'>

export interface TransactionPreview {
  invoiceCompetency?: string
  dueDay?: number
  installments: Array<{
    installmentNumber: number
    date: string
    competency: string
    value: number
  }>
  bankAccountCurrentBalance?: number
  bankAccountBalanceAfter?: number
  bankAccountName?: string
}

export interface InstallmentGroupPayload {
  date: string
  type: TransactionType
  paymentMethod: PaymentMethod
  personId: number
  category: string
  description: string
  value: number
  creditCardId: number
  totalInstallments: number
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
  persons: string[]
  categories: string[]
  paymentMethods: PaymentMethod[]
  creditCards: string[]
  competencies: string[]
}

export const CREDIT_CARD_NONE_VALUE = '__none__'

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
  bankAccounts: BankAccount[]
  savingsGoals: SavingsGoal[]
  recurringTransactions: RecurringTransaction[]
  investments: Investment[]
  persons: Person[]
}




