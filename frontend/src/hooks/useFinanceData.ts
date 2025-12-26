import { useCallback, useEffect, useMemo, useState } from 'react'
import { financeService } from '../services/financeService'
import type {
  Budget,
  BudgetPayload,
  CreditCard,
  CreditCardPayload,
  DepositPayload,
  FinanceState,
  Investment,
  InvestmentPayload,
  Person,
  RecurringTransaction,
  RecurringTransactionPayload,
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
  recurringTransactions: [],
  investments: [],
  persons: [],
}

interface FinanceActions {
  refresh: () => Promise<void>
  addTransactions: (payloads: TransactionPayload[]) => Promise<Transaction[]>
  updateTransaction: (id: number, payload: TransactionPayload) => Promise<Transaction>
  deleteTransaction: (id: number) => Promise<void>
  getInstallments: (parentPurchaseId: number) => Promise<Transaction[]>
  deleteAllInstallments: (parentPurchaseId: number) => Promise<void>
  updateInstallments: (parentPurchaseId: number, payload: { newTotalValue?: number; newPurchaseDate?: string }) => Promise<Transaction[]>
  addBudget: (payload: BudgetPayload) => Promise<Budget>
  deleteBudget: (id: number) => Promise<void>
  saveCategories: (categories: string[]) => Promise<void>
  closeMonth: (month: string) => Promise<void>
  reopenMonth: (month: string) => Promise<void>
  addCreditCard: (payload: CreditCardPayload) => Promise<CreditCard>
  updateCreditCard: (id: number, payload: CreditCardPayload) => Promise<CreditCard>
  deleteCreditCard: (id: number) => Promise<void>
  addSavingsGoal: (payload: SavingsGoalPayload) => Promise<SavingsGoal>
  updateSavingsGoal: (id: number, payload: SavingsGoalPayload) => Promise<SavingsGoal>
  deleteSavingsGoal: (id: number) => Promise<void>
  addDeposit: (payload: DepositPayload) => Promise<SavingsGoal>
  updateDeposit: (depositId: number, payload: Omit<DepositPayload, 'goalId'>) => Promise<SavingsGoal>
  importTransactions: (file: File) => Promise<{ totalProcessed: number; successCount: number; errorCount: number; errors: string[] }>
  exportTransactions: (startDate?: string, endDate?: string) => Promise<void>
  addRecurringTransaction: (payload: RecurringTransactionPayload) => Promise<RecurringTransaction>
  updateRecurringTransaction: (id: number, payload: RecurringTransactionPayload) => Promise<RecurringTransaction>
  deleteRecurringTransaction: (id: number) => Promise<void>
  generateRecurringTransactions: (competency: string) => Promise<Transaction[]>
  addInvestment: (payload: InvestmentPayload) => Promise<Investment>
  updateInvestment: (id: number, payload: InvestmentPayload) => Promise<Investment>
  deleteInvestment: (id: number) => Promise<void>
  createPerson: (payload: { name: string; allowSplit?: boolean; splitWithPersonIds?: number[] }) => Promise<Person>
  updatePerson: (id: number, payload: { name: string; allowSplit?: boolean; splitWithPersonIds?: number[] }) => Promise<Person>
  deletePerson: (id: number, payload: { migrateToPersonId?: number; deleteTransactions: boolean }) => Promise<void>
}

export function useFinanceData() {
  const [state, setState] = useState<FinanceState>(initialState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [transactions, budgets, categories, closedMonths, creditCards, savingsGoals, recurringTransactions, investments, persons] = await Promise.all([
        financeService.getTransactions(),
        financeService.getBudgets(),
        financeService.getCategories(),
        financeService.getClosedMonths(),
        financeService.getCreditCards(),
        financeService.getSavingsGoals(),
        financeService.getRecurringTransactions(),
        financeService.getInvestments(),
        financeService.getPersons(),
      ])

      const mappedTransactions = transactions.map((tx) => ({
        ...tx,
        creditCard: tx.creditCardId ? String(tx.creditCardId) : tx.creditCard,
      }))

      setState({
        transactions: mappedTransactions,
        budgets,
        categories,
        closedMonths,
        creditCards,
        savingsGoals,
        recurringTransactions,
        investments,
        persons,
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

  // Removido: refresh automático ao ganhar foco
  // Os dados serão atualizados apenas após ações do usuário (create, delete, etc)

  const addTransactions = useCallback(async (payloads: TransactionPayload[]) => {
    const created: Transaction[] = []
    for (const payload of payloads) {
      const tx = await financeService.createTransaction(payload)
      created.push(tx)
    }
    await refresh()
    return created
  }, [refresh])

  const updateTransaction = useCallback(async (id: number, payload: TransactionPayload) => {
    const updated = await financeService.updateTransaction(id, payload)
    await refresh()
    return updated
  }, [refresh])

  const deleteTransaction = useCallback(async (id: number) => {
    await financeService.deleteTransaction(id)
    await refresh()
  }, [refresh])

  const getInstallments = useCallback(async (parentPurchaseId: number) => {
    return financeService.getInstallments(parentPurchaseId)
  }, [])

  const deleteAllInstallments = useCallback(async (parentPurchaseId: number) => {
    await financeService.deleteAllInstallments(parentPurchaseId)
    await refresh()
  }, [refresh])

  const updateInstallments = useCallback(async (parentPurchaseId: number, payload: { newTotalValue?: number; newPurchaseDate?: string }) => {
    const updated = await financeService.updateInstallments(parentPurchaseId, payload)
    await refresh()
    return updated
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

  const updateCreditCard = useCallback(async (id: number, payload: CreditCardPayload) => {
    const updated = await financeService.updateCreditCard(id, payload)
    await refresh()
    return updated
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

  const updateSavingsGoal = useCallback(async (id: number, payload: SavingsGoalPayload) => {
    const updated = await financeService.updateSavingsGoal(id, payload)
    await refresh()
    return updated
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

  const updateDeposit = useCallback(async (depositId: number, payload: Omit<DepositPayload, 'goalId'>) => {
    const updated = await financeService.updateDeposit(depositId, payload)
    await refresh()
    return updated
  }, [refresh])

  const importTransactions = useCallback(async (file: File) => {
    try {
      const result = await financeService.importTransactions(file)
      // Refresh apenas após a importação ser concluída
      await refresh()
      return result
    } catch (error) {
      // Não faz refresh em caso de erro para manter o estado
      throw error
    }
  }, [refresh])

  const addRecurringTransaction = useCallback(async (payload: RecurringTransactionPayload) => {
    const created = await financeService.createRecurringTransaction(payload)
    await refresh()
    return created
  }, [refresh])

  const updateRecurringTransaction = useCallback(async (id: number, payload: RecurringTransactionPayload) => {
    const updated = await financeService.updateRecurringTransaction(id, payload)
    await refresh()
    return updated
  }, [refresh])

  const deleteRecurringTransaction = useCallback(async (id: number) => {
    await financeService.deleteRecurringTransaction(id)
    await refresh()
  }, [refresh])

  const generateRecurringTransactions = useCallback(async (competency: string) => {
    const generated = await financeService.generateRecurringTransactions(competency)
    await refresh()
    return generated
  }, [refresh])

  const exportTransactions = useCallback(async (startDate?: string, endDate?: string) => {
    await financeService.exportTransactions(startDate, endDate)
  }, [])

  const addInvestment = useCallback(async (payload: InvestmentPayload) => {
    const created = await financeService.createInvestment(payload)
    await refresh()
    return created
  }, [refresh])

  const updateInvestment = useCallback(async (id: number, payload: InvestmentPayload) => {
    const updated = await financeService.updateInvestment(id, payload)
    await refresh()
    return updated
  }, [refresh])

  const deleteInvestment = useCallback(async (id: number) => {
    await financeService.deleteInvestment(id)
    await refresh()
  }, [refresh])

  const createPerson = useCallback(async (payload: { name: string; allowSplit?: boolean; splitWithPersonIds?: number[] }) => {
    const created = await financeService.createPerson(payload)
    await refresh()
    return created
  }, [refresh])

  const updatePerson = useCallback(async (id: number, payload: { name: string; allowSplit?: boolean; splitWithPersonIds?: number[] }) => {
    const updated = await financeService.updatePerson(id, payload)
    await refresh()
    return updated
  }, [refresh])

  const deletePerson = useCallback(async (id: number, payload: { migrateToPersonId?: number; deleteTransactions: boolean }) => {
    await financeService.deletePerson(id, payload)
    await refresh()
  }, [refresh])

  const actions: FinanceActions = useMemo(
    () => ({
      refresh,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      getInstallments,
      deleteAllInstallments,
      updateInstallments,
      addBudget,
      deleteBudget,
      saveCategories,
      closeMonth,
      reopenMonth,
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      addDeposit,
      updateDeposit,
      importTransactions,
      exportTransactions,
      addRecurringTransaction,
      updateRecurringTransaction,
      deleteRecurringTransaction,
      generateRecurringTransactions,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      createPerson,
      updatePerson,
      deletePerson,
    }),
    [
      refresh,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      getInstallments,
      deleteAllInstallments,
      updateInstallments,
      addBudget,
      deleteBudget,
      saveCategories,
      closeMonth,
      reopenMonth,
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      addDeposit,
      updateDeposit,
      importTransactions,
      exportTransactions,
      addRecurringTransaction,
      updateRecurringTransaction,
      deleteRecurringTransaction,
      generateRecurringTransactions,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      createPerson,
      updatePerson,
      deletePerson,
    ],
  )

  return { state, loading, error, actions }
}

