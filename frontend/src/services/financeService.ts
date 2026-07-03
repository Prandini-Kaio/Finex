import type {
  BankAccount,
  BankAccountPayload,
  Budget,
  BudgetPayload,
  CreditCard,
  CreditCardPayload,
  CreditCardInvoicePayload,
  CreditCardInvoiceReceipt,
  CreditCardInvoiceStatus,
  PayAllCreditCardInvoicesPayload,
  DepositPayload,
  FinanceFilters,
  InstallmentGroupCommonFieldsPayload,
  InstallmentGroupPayload,
  Investment,
  InvestmentPayload,
  Person,
  RecurringTransaction,
  RecurringTransactionPayload,
  SavingsDeposit,
  SavingsGoal,
  SavingsGoalPayload,
  Transaction,
  TransactionPayload,
  TransactionPreview,
  UpdateInstallmentsPayload,
} from '../types/finance'
import { CREDIT_CARD_NONE_VALUE } from '../types/finance'
import { httpClient } from './httpClient'

function mapTransactionResponse(tx: Transaction): Transaction {
  const raw = tx as Transaction & { parentPurchaseId?: number }
  return {
    ...tx,
    creditCard: tx.creditCardId ? String(tx.creditCardId) : tx.creditCard,
    parentPurchase: tx.parentPurchase ?? raw.parentPurchaseId,
  }
}

function buildTransactionFilterQuery(filters: FinanceFilters): string {
  const params = new URLSearchParams()

  filters.competencies.forEach((competency) => params.append('competency', competency))
  filters.persons.forEach((person) => params.append('person', person))
  filters.categories.forEach((category) => params.append('category', category))
  filters.paymentMethods.forEach((method) => params.append('paymentMethod', method))

  const cardIds = filters.creditCards.filter((id) => id !== CREDIT_CARD_NONE_VALUE)
  cardIds.forEach((id) => params.append('creditCardId', id))

  if (filters.creditCards.includes(CREDIT_CARD_NONE_VALUE)) {
    params.append('withoutCreditCard', 'true')
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

function transactionPayloadToApiBody(payload: TransactionPayload): Record<string, unknown> {
  const raw = payload as TransactionPayload & { parentPurchaseId?: number }
  const parentPurchaseId = raw.parentPurchase ?? raw.parentPurchaseId
  const creditCardId =
    payload.creditCardId ?? (payload.creditCard ? Number(payload.creditCard) : undefined)
  const body: Record<string, unknown> = {
    date: payload.date,
    type: payload.type,
    paymentMethod: payload.paymentMethod,
    personId: payload.personId,
    category: payload.category,
    description: payload.description,
    value: payload.value,
    competency: payload.competency,
    installments: payload.installments,
    installmentNumber: payload.installmentNumber,
    totalInstallments: payload.totalInstallments,
  }
  if (creditCardId != null && !Number.isNaN(creditCardId)) {
    body.creditCardId = creditCardId
  }
  if (parentPurchaseId != null && !Number.isNaN(Number(parentPurchaseId))) {
    body.parentPurchaseId = Number(parentPurchaseId)
  }
  if (payload.bankAccountId != null && !Number.isNaN(payload.bankAccountId)) {
    body.bankAccountId = payload.bankAccountId
  }
  return body
}

export const financeService = {
  getTransactions(filters?: FinanceFilters): Promise<Transaction[]> {
    const query = filters ? buildTransactionFilterQuery(filters) : ''
    return httpClient<Transaction[]>(`/api/transactions${query}`).then((list) => list.map(mapTransactionResponse))
  },
  createTransaction(payload: TransactionPayload): Promise<Transaction> {
    return httpClient<Transaction>('/api/transactions', {
      method: 'POST',
      body: transactionPayloadToApiBody(payload),
    }).then(mapTransactionResponse)
  },
  createInstallmentGroup(payload: InstallmentGroupPayload): Promise<Transaction[]> {
    return httpClient<Transaction[]>('/api/transactions/installment-groups', {
      method: 'POST',
      body: payload,
    }).then((list) => list.map(mapTransactionResponse))
  },
  previewTransaction(payload: {
    date: string
    type: TransactionPayload['type']
    paymentMethod: TransactionPayload['paymentMethod']
    value: number
    creditCardId?: number
    bankAccountId?: number
    totalInstallments?: number
  }): Promise<TransactionPreview> {
    return httpClient<TransactionPreview>('/api/transactions/preview', {
      method: 'POST',
      body: payload,
    })
  },
  updateTransaction(id: number, payload: TransactionPayload): Promise<Transaction> {
    return httpClient<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: transactionPayloadToApiBody(payload),
    })
  },
  deleteTransaction(id: number): Promise<void> {
    return httpClient<void>(`/api/transactions/${id}`, {
      method: 'DELETE',
    })
  },
  getInstallments(parentPurchaseId: number): Promise<Transaction[]> {
    return httpClient<Transaction[]>(`/api/transactions/installments/${parentPurchaseId}`).then((list) =>
      list.map((tx) => {
        const raw = tx as Transaction & { parentPurchaseId?: number }
        return {
          ...tx,
          parentPurchase: tx.parentPurchase ?? raw.parentPurchaseId,
        }
      }),
    )
  },
  deleteAllInstallments(parentPurchaseId: number): Promise<void> {
    return httpClient<void>(`/api/transactions/installments/${parentPurchaseId}`, {
      method: 'DELETE',
    })
  },
  updateInstallments(parentPurchaseId: number, payload: UpdateInstallmentsPayload): Promise<Transaction[]> {
    return httpClient<Transaction[]>(`/api/transactions/installments/${parentPurchaseId}`, {
      method: 'PUT',
      body: payload,
    }).then((list) =>
      list.map((tx) => {
        const raw = tx as Transaction & { parentPurchaseId?: number }
        return {
          ...tx,
          parentPurchase: tx.parentPurchase ?? raw.parentPurchaseId,
        }
      }),
    )
  },
  updateInstallmentGroupCommonFields(
    parentPurchaseId: number,
    payload: InstallmentGroupCommonFieldsPayload,
  ): Promise<Transaction[]> {
    return httpClient<Transaction[]>(`/api/transactions/installments/${parentPurchaseId}/common-fields`, {
      method: 'PATCH',
      body: payload,
    }).then((list) =>
      list.map((tx) => {
        const raw = tx as Transaction & { parentPurchaseId?: number }
        return {
          ...tx,
          parentPurchase: tx.parentPurchase ?? raw.parentPurchaseId,
        }
      }),
    )
  },
  anticipateInstallments(
    parentPurchaseId: number,
    payload: { fromInstallmentNumber: number; toInstallmentNumber: number; targetCompetency?: string },
  ): Promise<Transaction[]> {
    return httpClient<Transaction[]>(`/api/transactions/installments/${parentPurchaseId}/anticipate`, {
      method: 'POST',
      body: payload,
    })
  },
  getBudgets(): Promise<Budget[]> {
    return httpClient<Budget[]>('/api/budgets')
  },
  createBudget(payload: BudgetPayload): Promise<Budget> {
    return httpClient<Budget>('/api/budgets', {
      method: 'POST',
      body: payload,
    })
  },
  deleteBudget(id: number): Promise<void> {
    return httpClient<void>(`/api/budgets/${id}`, {
      method: 'DELETE',
    })
  },
  getCategories(): Promise<string[]> {
    return httpClient<string[]>('/api/categories')
  },
  async saveCategories(categories: string[]): Promise<string[]> {
    return httpClient<string[]>('/api/categories', {
      method: 'PUT',
      body: categories,
    })
  },
  getClosedMonths(): Promise<string[]> {
    return httpClient<string[]>('/api/closed-months')
  },
  async closeMonth(month: string): Promise<string[]> {
    return httpClient<string[]>('/api/closed-months', {
      method: 'POST',
      body: { month },
    })
  },
  async reopenMonth(month: string): Promise<string[]> {
    // Usar query parameter para evitar problemas com a barra na URL
    return httpClient<string[]>(`/api/closed-months?month=${encodeURIComponent(month)}`, {
      method: 'DELETE',
    })
  },
  getCreditCards(): Promise<CreditCard[]> {
    return httpClient<CreditCard[]>('/api/credit-cards')
  },
  getCreditCardInvoices(competency: string): Promise<CreditCardInvoiceStatus[]> {
    const query = encodeURIComponent(competency)
    return httpClient<CreditCardInvoiceStatus[]>(`/api/credit-card-invoices?month=${query}`)
  },
  updateAllCreditCardInvoices(payload: PayAllCreditCardInvoicesPayload): Promise<CreditCardInvoiceStatus[]> {
    return httpClient<CreditCardInvoiceStatus[]>('/api/credit-card-invoices', {
      method: 'PUT',
      body: payload,
    })
  },
  updateCreditCardInvoiceStatus(cardId: number, payload: CreditCardInvoicePayload): Promise<CreditCardInvoiceStatus> {
    return httpClient<CreditCardInvoiceStatus>(`/api/credit-card-invoices/${cardId}`, {
      method: 'PUT',
      body: payload,
    })
  },
  getCreditCardInvoiceReceipt(cardId: number, month: string): Promise<CreditCardInvoiceReceipt> {
    const query = encodeURIComponent(month)
    return httpClient<CreditCardInvoiceReceipt>(`/api/credit-card-invoices/${cardId}/receipt?month=${query}`)
  },
  createCreditCard(payload: CreditCardPayload): Promise<CreditCard> {
    return httpClient<CreditCard>('/api/credit-cards', {
      method: 'POST',
      body: payload,
    })
  },
  updateCreditCard(id: number, payload: CreditCardPayload): Promise<CreditCard> {
    return httpClient<CreditCard>(`/api/credit-cards/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
  deleteCreditCard(id: number): Promise<void> {
    return httpClient<void>(`/api/credit-cards/${id}`, {
      method: 'DELETE',
    })
  },
  getSavingsGoals(): Promise<SavingsGoal[]> {
    return httpClient<SavingsGoal[]>('/api/savings-goals')
  },
  createSavingsGoal(payload: SavingsGoalPayload): Promise<SavingsGoal> {
    return httpClient<SavingsGoal>('/api/savings-goals', {
      method: 'POST',
      body: payload,
    })
  },
  updateSavingsGoal(id: number, payload: SavingsGoalPayload): Promise<SavingsGoal> {
    return httpClient<SavingsGoal>(`/api/savings-goals/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
  deleteSavingsGoal(id: number): Promise<void> {
    return httpClient<void>(`/api/savings-goals/${id}`, {
      method: 'DELETE',
    })
  },
  async addDeposit(payload: DepositPayload): Promise<SavingsGoal> {
    return httpClient<SavingsGoal>(`/api/savings-goals/${payload.goalId}/deposits`, {
      method: 'POST',
      body: payload,
    })
  },
  getAllDeposits(): Promise<SavingsDeposit[]> {
    return httpClient<SavingsDeposit[]>('/api/savings-goals/deposits')
  },
  updateDeposit(depositId: number, payload: Omit<DepositPayload, 'goalId'>): Promise<SavingsGoal> {
    return httpClient<SavingsGoal>(`/api/savings-goals/deposits/${depositId}`, {
      method: 'PUT',
      body: payload,
    })
  },
  async importTransactions(file: File): Promise<{ totalProcessed: number; successCount: number; errorCount: number; errors: string[] }> {
    console.log('financeService.importTransactions - Iniciando upload do arquivo:', file.name)
    const formData = new FormData()
    formData.append('file', file)

    // Usa a mesma lógica de detecção do httpClient
    function getApiUrl(): string {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
      }
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:8080'
        }
        return `http://${hostname}:8080`
      }
      return 'http://localhost:8080'
    }
    
    const API_URL = getApiUrl()
    console.log('Enviando para:', `${API_URL}/api/transactions/import`)
    
    try {
      const response = await fetch(`${API_URL}/api/transactions/import`, {
        method: 'POST',
        body: formData,
      })

      console.log('Resposta recebida:', response.status, response.statusText)

      if (!response.ok) {
        const message = await response.text()
        console.error('Erro na resposta:', message)
        throw new Error(message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('Resultado da importação:', result)
      return result
    } catch (error) {
      console.error('Erro no fetch:', error)
      throw error
    }
  },
  getRecurringTransactions(): Promise<RecurringTransaction[]> {
    return httpClient<RecurringTransaction[]>('/api/recurring-transactions')
  },
  createRecurringTransaction(payload: RecurringTransactionPayload): Promise<RecurringTransaction> {
    return httpClient<RecurringTransaction>('/api/recurring-transactions', {
      method: 'POST',
      body: payload,
    })
  },
  updateRecurringTransaction(id: number, payload: RecurringTransactionPayload): Promise<RecurringTransaction> {
    return httpClient<RecurringTransaction>(`/api/recurring-transactions/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
  deleteRecurringTransaction(id: number): Promise<void> {
    return httpClient<void>(`/api/recurring-transactions/${id}`, {
      method: 'DELETE',
    })
  },
  generateRecurringTransactions(competency: string): Promise<Transaction[]> {
    return httpClient<Transaction[]>(`/api/recurring-transactions/generate?competency=${encodeURIComponent(competency)}`, {
      method: 'POST',
    })
  },
  async exportTransactions(startDate?: string, endDate?: string): Promise<void> {
    // Usa a mesma lógica de detecção do httpClient
    function getApiUrl(): string {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
      }
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:8080'
        }
        return `http://${hostname}:8080`
      }
      return 'http://localhost:8080'
    }
    
    // Calcula a URL da API dinamicamente
    const API_URL = getApiUrl()
    
    // Constrói a URL com parâmetros opcionais
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const queryString = params.toString()
    const url = `${API_URL}/api/transactions/export${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `HTTP ${response.status}`)
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    
    // Tenta obter o nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = 'lancamentos_exportados.csv'
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  },

  // Investments
  getInvestments(): Promise<Investment[]> {
    return httpClient<Investment[]>('/api/investments')
  },
  createInvestment(payload: InvestmentPayload): Promise<Investment> {
    return httpClient<Investment>('/api/investments', {
      method: 'POST',
      body: payload,
    })
  },
  updateInvestment(id: number, payload: InvestmentPayload): Promise<Investment> {
    return httpClient<Investment>(`/api/investments/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
  deleteInvestment(id: number): Promise<void> {
    return httpClient<void>(`/api/investments/${id}`, {
      method: 'DELETE',
    })
  },

  getPersons(): Promise<Person[]> {
    return httpClient<Person[]>('/api/persons')
  },
  createPerson(payload: { name: string; allowSplit?: boolean; splits?: Person['splits'] }): Promise<Person> {
    return httpClient<Person>('/api/persons', {
      method: 'POST',
      body: payload,
    })
  },
  updatePerson(id: number, payload: { name: string; allowSplit?: boolean; splits?: Person['splits'] }): Promise<Person> {
    return httpClient<Person>(`/api/persons/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
  deletePerson(id: number, payload: { migrateToPersonId?: number; deleteTransactions: boolean }): Promise<void> {
    return httpClient<void>(`/api/persons/${id}`, {
      method: 'DELETE',
      body: payload,
    })
  },

  getBankAccounts(ownerId?: number): Promise<BankAccount[]> {
    const query = ownerId ? `?ownerId=${ownerId}` : ''
    return httpClient<BankAccount[]>(`/api/bank-accounts${query}`)
  },
  createBankAccount(payload: BankAccountPayload): Promise<BankAccount> {
    return httpClient<BankAccount>('/api/bank-accounts', { method: 'POST', body: payload })
  },
  updateBankAccount(id: number, payload: BankAccountPayload): Promise<BankAccount> {
    return httpClient<BankAccount>(`/api/bank-accounts/${id}`, { method: 'PUT', body: payload })
  },
  deleteBankAccount(id: number): Promise<void> {
    return httpClient<void>(`/api/bank-accounts/${id}`, { method: 'DELETE' })
  },
}

