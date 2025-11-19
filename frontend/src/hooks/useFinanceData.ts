import { useCallback, useEffect, useMemo, useState } from 'react'
import { financeService } from '../services/financeService'
import type {
  Budget,
  BudgetPayload,
  CreditCard,
  CreditCardPayload,
  DepositPayload,
  FinanceState,
  SavingsGoal,
  SavingsGoalPayload,
  Transaction,
  TransactionPayload,
} from '../types/finance'

const initialState: FinanceState = {
  transactions: [],
  budgets: [],
  categories: [],
  closedMonths: [],
  creditCards: [],
  savingsGoals: [],
}

interface FinanceActions {
  refresh: () => Promise<void>
  addTransactions: (payloads: TransactionPayload[]) => Promise<Transaction[]>
  deleteTransaction: (id: number) => Promise<void>
  addBudget: (payload: BudgetPayload) => Promise<Budget>
  deleteBudget: (id: number) => Promise<void>
  saveCategories: (categories: string[]) => Promise<void>
  closeMonth: (month: string) => Promise<void>
  reopenMonth: (month: string) => Promise<void>
  addCreditCard: (payload: CreditCardPayload) => Promise<CreditCard>
  deleteCreditCard: (id: number) => Promise<void>
  addSavingsGoal: (payload: SavingsGoalPayload) => Promise<SavingsGoal>
  deleteSavingsGoal: (id: number) => Promise<void>
  addDeposit: (payload: DepositPayload) => Promise<SavingsGoal>
}

export function useFinanceData() {
  const [state, setState] = useState<FinanceState>(initialState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [transactions, budgets, categories, closedMonths, creditCards, savingsGoals] = await Promise.all([
        financeService.getTransactions(),
        financeService.getBudgets(),
        financeService.getCategories(),
        financeService.getClosedMonths(),
        financeService.getCreditCards(),
        financeService.getSavingsGoals(),
      ])

      setState({
        transactions,
        budgets,
        categories,
        closedMonths,
        creditCards,
        savingsGoals,
      })
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Recarrega dados quando a aba/janela ganha foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refresh()
      }
    }

    const handleFocus = () => {
      refresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refresh])

  const addTransactions = useCallback(async (payloads: TransactionPayload[]) => {
    const created: Transaction[] = []
    for (const payload of payloads) {
      const tx = await financeService.createTransaction(payload)
      created.push(tx)
    }
    await refresh()
    return created
  }, [refresh])

  const deleteTransaction = useCallback(async (id: number) => {
    await financeService.deleteTransaction(id)
    await refresh()
  }, [refresh])

  const addBudget = useCallback(async (payload: BudgetPayload) => {
    const created = await financeService.createBudget(payload)
    await refresh()
    return created
  }, [refresh])

  const deleteBudget = useCallback(async (id: number) => {
    await financeService.deleteBudget(id)
    await refresh()
  }, [refresh])

  const saveCategories = useCallback(async (categories: string[]) => {
    await financeService.saveCategories(categories)
    await refresh()
  }, [refresh])

  const closeMonth = useCallback(async (month: string) => {
    await financeService.closeMonth(month)
    await refresh()
  }, [refresh])

  const reopenMonth = useCallback(async (month: string) => {
    await financeService.reopenMonth(month)
    await refresh()
  }, [refresh])

  const addCreditCard = useCallback(async (payload: CreditCardPayload) => {
    const created = await financeService.createCreditCard(payload)
    await refresh()
    return created
  }, [refresh])

  const deleteCreditCard = useCallback(async (id: number) => {
    await financeService.deleteCreditCard(id)
    await refresh()
  }, [refresh])

  const addSavingsGoal = useCallback(async (payload: SavingsGoalPayload) => {
    const created = await financeService.createSavingsGoal(payload)
    await refresh()
    return created
  }, [refresh])

  const deleteSavingsGoal = useCallback(async (id: number) => {
    await financeService.deleteSavingsGoal(id)
    await refresh()
  }, [refresh])

  const addDeposit = useCallback(async (payload: DepositPayload) => {
    const updated = await financeService.addDeposit(payload)
    await refresh()
    return updated
  }, [refresh])

  const actions: FinanceActions = useMemo(
    () => ({
      refresh,
      addTransactions,
      deleteTransaction,
      addBudget,
      deleteBudget,
      saveCategories,
      closeMonth,
      reopenMonth,
      addCreditCard,
      deleteCreditCard,
      addSavingsGoal,
      deleteSavingsGoal,
      addDeposit,
    }),
    [
      refresh,
      addTransactions,
      deleteTransaction,
      addBudget,
      deleteBudget,
      saveCategories,
      closeMonth,
      reopenMonth,
      addCreditCard,
      deleteCreditCard,
      addSavingsGoal,
      deleteSavingsGoal,
      addDeposit,
    ],
  )

  return { state, loading, error, actions }
}

