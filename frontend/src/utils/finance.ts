import type { FinanceFilters, Person, SavingsGoal, Transaction, TransactionPayload } from '../types/finance'

export const DEFAULT_FILTERS: FinanceFilters = {
  person: 'Todos',
  category: 'Todas',
  paymentType: 'Todos',
  creditCard: 'Todos',
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
    const monthMatch = transaction.competency === selectedMonth
    const personMatch = filters.person === 'Todos' || transaction.person === filters.person
    const categoryMatch = filters.category === 'Todas' || transaction.category === filters.category
    const paymentMatch = filters.paymentType === 'Todos' || transaction.paymentMethod === filters.paymentType
    
    // Filtro por cartão de crédito
    let creditCardMatch = true
    if (filters.creditCard !== 'Todos') {
      if (filters.creditCard === 'Sem cartão') {
        // Mostrar apenas transações sem cartão
        creditCardMatch = !transaction.creditCardId && !transaction.creditCard
      } else {
        // Comparar por ID ou nome do cartão
        const transactionCardId = transaction.creditCardId ?? (transaction.creditCard ? Number(transaction.creditCard) : null)
        const filterCardId = Number(filters.creditCard)
        creditCardMatch = transactionCardId === filterCardId
      }
    }
    
    return monthMatch && personMatch && categoryMatch && paymentMatch && creditCardMatch
  })
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

