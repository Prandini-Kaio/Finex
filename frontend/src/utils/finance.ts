import type { FinanceFilters, Person, SavingsGoal, Transaction, TransactionPayload } from '../types/finance'

export const DEFAULT_FILTERS: FinanceFilters = {
  person: 'Todos',
  category: 'Todas',
  paymentType: 'Todos',
}

export function getCurrentCompetency(): string {
  const now = new Date()
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
}

export function filterTransactions(
  transactions: Transaction[],
  selectedMonth: string,
  filters: FinanceFilters,
): Transaction[] {
  return transactions.filter((transaction) => {
    const monthMatch = transaction.competency === selectedMonth
    const personMatch = filters.person === 'Todos' || transaction.person === filters.person
    const categoryMatch = filters.category === 'Todas' || transaction.category === filters.category
    const paymentMatch = filters.paymentType === 'Todos' || transaction.paymentMethod === filters.paymentType
    return monthMatch && personMatch && categoryMatch && paymentMatch
  })
}

export function buildInstallments(form: {
  date: string
  type: Transaction['type']
  paymentMethod: Transaction['paymentMethod']
  person: Person
  category: string
  description: string
  value: number
  competency: string
  creditCard?: string
  installments: number
}): TransactionPayload[] {
  const installments = form.installments || 1
  const base: TransactionPayload = {
    date: form.date,
    type: form.type,
    paymentMethod: form.paymentMethod,
    person: form.person,
    category: form.category,
    description: form.description,
    value: Number(form.value),
    competency: form.competency,
    creditCard: form.creditCard,
    installments,
    installmentNumber: 1 as number,
    totalInstallments: installments,
    parentPurchase: undefined,
  }

  if (installments === 1) {
    return [{ ...base }]
  }

  const purchaseDate = new Date(form.date)
  const parentPurchase = Date.now()
  const installmentValue = form.value / installments

  return Array.from({ length: installments }).map((_, index) => {
    const competencyDate = new Date(purchaseDate)
    competencyDate.setMonth(purchaseDate.getMonth() + index)
    const competency = `${String(competencyDate.getMonth() + 1).padStart(2, '0')}/${competencyDate.getFullYear()}`
    return {
      ...base,
      value: Number(installmentValue),
      competency,
      installmentNumber: index + 1,
      parentPurchase,
    }
  })
}

export function getSavingsProgress(goals: SavingsGoal[]) {
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const totalGoals = goals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  return {
    totalSaved,
    totalGoals,
    percentage: totalGoals > 0 ? (totalSaved / totalGoals) * 100 : 0,
  }
}

