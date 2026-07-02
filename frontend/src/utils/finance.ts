import type { FinanceFilters, Person, SavingsGoal, Transaction, TransactionPayload } from '../types/finance'
import { CREDIT_CARD_NONE_VALUE } from '../types/finance'

export const DEFAULT_FILTERS: FinanceFilters = {
  persons: [],
  categories: [],
  paymentMethods: [],
  creditCards: [],
  competencies: [getCurrentCompetency()],
}

export function getPersonIdByName(persons: Person[], name: string): number | undefined {
  return persons.find(p => p.name === name)?.id
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
    const monthMatch =
      filters.competencies.length > 0
        ? filters.competencies.includes(transaction.competency)
        : transaction.competency === selectedMonth
    const personMatch = filters.persons.length === 0 || filters.persons.includes(transaction.person)
    const categoryMatch = filters.categories.length === 0 || filters.categories.includes(transaction.category)
    const paymentMatch =
      filters.paymentMethods.length === 0 || filters.paymentMethods.includes(transaction.paymentMethod)

    let creditCardMatch = true
    if (filters.creditCards.length > 0) {
      const wantsNone = filters.creditCards.includes(CREDIT_CARD_NONE_VALUE)
      const cardIds = filters.creditCards
        .filter((id) => id !== CREDIT_CARD_NONE_VALUE)
        .map(Number)
      const transactionCardId =
        transaction.creditCardId ?? (transaction.creditCard ? Number(transaction.creditCard) : null)
      const matchesCard = transactionCardId != null && cardIds.includes(transactionCardId)
      const matchesNone = wantsNone && transactionCardId == null
      creditCardMatch = matchesCard || matchesNone
    }

    return monthMatch && personMatch && categoryMatch && paymentMatch && creditCardMatch
  })
}

export function buildCompetencyOptions(yearsRange = 2): string[] {
  const now = new Date()
  const options: string[] = []
  for (let year = now.getFullYear() - yearsRange; year <= now.getFullYear() + yearsRange; year++) {
    for (let month = 1; month <= 12; month++) {
      options.push(`${String(month).padStart(2, '0')}/${year}`)
    }
  }
  return options.reverse()
}

export function buildInstallments(form: {
  date: string
  type: Transaction['type']
  paymentMethod: Transaction['paymentMethod']
  person: string
  category: string
  description: string
  value: number
  competency: string
  creditCard?: string
  installments: number
  personId: number
}): TransactionPayload[] {
  const installments = form.installments || 1
  const base: TransactionPayload = {
    date: form.date,
    type: form.type,
    paymentMethod: form.paymentMethod,
    personId: form.personId,
    category: form.category,
    description: form.description,
    value: Number(form.value),
    competency: form.competency,
    creditCard: form.creditCard,
    creditCardId: form.creditCard ? Number(form.creditCard) : undefined,
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

export function getFirstInstallmentCompetency(purchaseDate: string): string {
  const date = new Date(purchaseDate)
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export function getInstallmentPreview(purchaseDate: string, totalValue: number, installments: number) {
  if (!purchaseDate || !totalValue || !installments || installments < 1) {
    return null
  }

  const purchaseDateObj = new Date(purchaseDate)
  const firstCompetency = getFirstInstallmentCompetency(purchaseDate)
  const installmentValue = totalValue / installments
  
  const allCompetencies = Array.from({ length: installments }).map((_, index) => {
    const competencyDate = new Date(purchaseDateObj)
    competencyDate.setMonth(purchaseDateObj.getMonth() + index)
    return `${String(competencyDate.getMonth() + 1).padStart(2, '0')}/${competencyDate.getFullYear()}`
  })

  return {
    firstCompetency,
    installmentValue,
    totalValue,
    installments,
    allCompetencies,
  }
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function allocateValueByPercentages(
  totalValue: number,
  splits: Array<{ splitWithPersonId: number; percentage: number }>,
): Record<number, number> {
  if (!Number.isFinite(totalValue) || !splits || splits.length === 0) {
    return {}
  }

  const sorted = [...splits].sort((a, b) => a.splitWithPersonId - b.splitWithPersonId)
  const roundedTotal = round2(totalValue)

  let allocatedSum = 0
  const result: Record<number, number> = {}

  for (let i = 0; i < sorted.length; i++) {
    const split = sorted[i]
    if (i < sorted.length - 1) {
      const share = round2((roundedTotal * split.percentage) / 100)
      result[split.splitWithPersonId] = share
      allocatedSum = round2(allocatedSum + share)
    } else {
      const residual = round2(roundedTotal - allocatedSum)
      result[split.splitWithPersonId] = residual
    }
  }

  return result
}

