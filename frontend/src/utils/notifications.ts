import type { CreditCard, RecurringTransaction } from '../types/finance'

export interface Notification {
  id: string
  type: 'warning' | 'info' | 'error'
  title: string
  message: string
  date?: string
  daysUntil?: number
}

/**
 * Calcula a próxima data de vencimento de um cartão baseado no dueDay
 */
function getNextDueDate(card: CreditCard): Date {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1 // 1-12
  // dueDay pode ser string ou number dependendo de como vem do backend
  const dueDay = typeof card.dueDay === 'string' ? parseInt(card.dueDay) : card.dueDay
  
  if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
    // Se o dia for inválido, retornar uma data futura para evitar erros
    return new Date(currentYear, currentMonth, 1)
  }
  
  // Data de vencimento deste mês
  let dueDate = new Date(currentYear, currentMonth - 1, dueDay)
  
  // Se já passou, usar o próximo mês
  if (dueDate < today) {
    dueDate = new Date(currentYear, currentMonth, dueDay)
  }
  
  return dueDate
}

/**
 * Calcula a próxima data de vencimento de uma transação recorrente baseado no dayOfMonth
 */
function getNextRecurringDate(recurring: RecurringTransaction): Date | null {
  if (!recurring.active) return null
  
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1 // 1-12
  const dayOfMonth = recurring.dayOfMonth
  
  // Verificar se há data de término
  if (recurring.endDate) {
    const endDate = new Date(recurring.endDate)
    if (endDate < today) return null
  }
  
  // Verificar se há data de início
  if (recurring.startDate) {
    const startDate = new Date(recurring.startDate)
    if (startDate > today) {
      // Ainda não começou, usar a data de início
      return startDate
    }
  }
  
  // Data deste mês
  let nextDate = new Date(currentYear, currentMonth - 1, dayOfMonth)
  
  // Se já passou, usar o próximo mês
  if (nextDate < today) {
    nextDate = new Date(currentYear, currentMonth, dayOfMonth)
  }
  
  // Verificar se não passou da data de término
  if (recurring.endDate) {
    const endDate = new Date(recurring.endDate)
    if (nextDate > endDate) return null
  }
  
  return nextDate
}

/**
 * Calcula dias até uma data
 */
function daysUntil(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Gera notificações para cartões com vencimento próximo
 */
export function getCreditCardNotifications(
  creditCards: CreditCard[],
  daysAhead: number = 7
): Notification[] {
  const notifications: Notification[] = []
  
  for (const card of creditCards) {
    const nextDueDate = getNextDueDate(card)
    const days = daysUntil(nextDueDate)
    
    if (days >= 0 && days <= daysAhead) {
      const dateStr = nextDueDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      
      notifications.push({
        id: `card-${card.id}`,
        type: days <= 3 ? 'error' : 'warning',
        title: `Cartão ${card.name} - Vencimento próximo`,
        message: `Vencimento em ${dateStr}`,
        date: nextDueDate.toISOString(),
        daysUntil: days,
      })
    }
  }
  
  return notifications.sort((a, b) => (a.daysUntil || 999) - (b.daysUntil || 999))
}

/**
 * Gera notificações para transações recorrentes com vencimento próximo
 */
export function getRecurringTransactionNotifications(
  recurringTransactions: RecurringTransaction[],
  daysAhead: number = 7
): Notification[] {
  const notifications: Notification[] = []
  
  for (const recurring of recurringTransactions) {
    if (!recurring.active) continue
    
    const nextDate = getNextRecurringDate(recurring)
    if (!nextDate) continue
    
    const days = daysUntil(nextDate)
    
    if (days >= 0 && days <= daysAhead) {
      const dateStr = nextDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      
      const valueStr = `R$ ${recurring.value.toFixed(2)}`
      const typeStr = recurring.type === 'Despesa' ? 'despesa' : 'receita'
      
      notifications.push({
        id: `recurring-${recurring.id}`,
        type: days <= 3 ? 'error' : 'warning',
        title: `${recurring.description} - ${typeStr} recorrente`,
        message: `Vencimento em ${dateStr} (${valueStr})`,
        date: nextDate.toISOString(),
        daysUntil: days,
      })
    }
  }
  
  return notifications.sort((a, b) => (a.daysUntil || 999) - (b.daysUntil || 999))
}

/**
 * Gera notificações para meses que precisam ser fechados
 */
export function getClosureNotifications(
  closedMonths: string[],
  monthsToCheck: number = 3
): Notification[] {
  const notifications: Notification[] = []
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1 // 1-12
  
  // Verificar os últimos N meses (incluindo o mês atual)
  for (let i = 0; i < monthsToCheck; i++) {
    const checkMonth = currentMonth - i
    let year = currentYear
    let month = checkMonth
    
    // Ajustar se o mês for negativo
    if (month <= 0) {
      month += 12
      year -= 1
    }
    
    const competency = `${String(month).padStart(2, '0')}/${year}`
    
    if (!closedMonths.includes(competency)) {
      const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
      
      notifications.push({
        id: `closure-${competency}`,
        type: i === 0 ? 'warning' : 'info',
        title: `Mês não fechado: ${monthName}`,
        message: `O mês ${competency} ainda não foi fechado`,
        date: competency,
      })
    }
  }
  
  return notifications
}

/**
 * Combina todas as notificações
 */
export function getAllNotifications(
  creditCards: CreditCard[],
  recurringTransactions: RecurringTransaction[],
  closedMonths: string[],
  daysAhead: number = 7
): Notification[] {
  const cardNotifications = getCreditCardNotifications(creditCards, daysAhead)
  const recurringNotifications = getRecurringTransactionNotifications(recurringTransactions, daysAhead)
  const closureNotifications = getClosureNotifications(closedMonths)
  
  return [...cardNotifications, ...recurringNotifications, ...closureNotifications]
    .sort((a, b) => {
      // Priorizar por tipo (error > warning > info)
      const typeOrder = { error: 0, warning: 1, info: 2 }
      const typeDiff = typeOrder[a.type] - typeOrder[b.type]
      if (typeDiff !== 0) return typeDiff
      
      // Depois por dias até
      return (a.daysUntil || 999) - (b.daysUntil || 999)
    })
}

