import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import type { CreditCardInvoiceStatus, Transaction } from '../types/finance'
import { MonthYearSelector } from '../components/MonthYearSelector'
import { financeService } from '../services/financeService'
import { allocateValueByPercentages } from '../utils/finance'
import { BulkPayModal, ReceiptModal, SinglePayModal } from '../components/invoices/InvoicePaymentModals'
import type { CreditCardInvoiceReceipt } from '../types/finance'

type MonthSummary = {
  totalCards: number
  paidCount: number
  pendingCount: number
  progress: number
}

type InvoiceFilter = 'all' | 'pending' | 'paid'

const invoiceFilterOptions: { value: InvoiceFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'paid', label: 'Pagos' },
]

const mapInvoicesByCard = (statuses: CreditCardInvoiceStatus[]) =>
  statuses.reduce<Record<number, CreditCardInvoiceStatus>>((acc, status) => {
    acc[status.creditCardId] = status
    return acc
  }, {})

const buildSummary = (cards: { id: number }[], statuses: CreditCardInvoiceStatus[]): MonthSummary => {
  const totalCards = cards.length
  if (totalCards === 0) {
    return { totalCards: 0, paidCount: 0, pendingCount: 0, progress: 0 }
  }

  const statusById = new Map(statuses.map((status) => [status.creditCardId, status]))
  const paidCount = cards.reduce((count, card) => (statusById.get(card.id)?.paid ? count + 1 : count), 0)
  const pendingCount = Math.max(totalCards - paidCount, 0)
  const progress = (paidCount / totalCards) * 100

  return { totalCards, paidCount, pendingCount, progress }
}

const getRecentMonths = (baseMonth: string, total = 6) => {
  const [year, month] = baseMonth.split('-').map(Number)
  const months: string[] = []

  for (let offset = total - 1; offset >= 0; offset -= 1) {
    const date = new Date(year, (month - 1) - offset, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.push(value)
  }

  return months
}

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface ClosureViewProps {
  selectedMonth: string
  onMonthChange: (value: string) => void
  transactions: Transaction[]
}

export const ClosureView: React.FC<ClosureViewProps> = ({ selectedMonth, onMonthChange, transactions }) => {
  const {
    state: { creditCards, closedMonths, persons, bankAccounts },
    actions,
  } = useFinance()

  const [invoiceStatuses, setInvoiceStatuses] = useState<Record<number, CreditCardInvoiceStatus>>({})
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [updatingCardId, setUpdatingCardId] = useState<number | null>(null)
  const [bulkUpdating, setBulkUpdating] = useState<'pay' | 'reset' | null>(null)
  const [monthSummaries, setMonthSummaries] = useState<Record<string, MonthSummary>>({})
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all')
  const [payModalCardId, setPayModalCardId] = useState<number | null>(null)
  const [payModalAccountId, setPayModalAccountId] = useState<number | null>(null)
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false)
  const [bulkAccountByCardId, setBulkAccountByCardId] = useState<Record<number, number>>({})
  const [receipt, setReceipt] = useState<CreditCardInvoiceReceipt | null>(null)
  const [receiptLoading, setReceiptLoading] = useState(false)

  const isClosed = closedMonths.includes(selectedMonth)
  const recentMonths = useMemo(() => getRecentMonths(selectedMonth, 6), [selectedMonth])

  useEffect(() => {
    let isMounted = true
    setInvoiceLoading(true)
    financeService
      .getCreditCardInvoices(selectedMonth)
      .then((statuses) => {
        if (!isMounted) return
        const mapped = mapInvoicesByCard(statuses)
        setInvoiceStatuses(mapped)
        setMonthSummaries((prev) => ({
          ...prev,
          [selectedMonth]: buildSummary(creditCards, statuses),
        }))
        setInvoiceError(null)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error(error)
        setInvoiceError(error instanceof Error ? error.message : 'Falha ao carregar status das faturas')
      })
      .finally(() => {
        if (isMounted) {
          setInvoiceLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [selectedMonth, creditCards])

  useEffect(() => {
    const missing = recentMonths.filter((month) => month !== selectedMonth && !monthSummaries[month])
    if (missing.length === 0) {
      return
    }

    let cancelled = false
    Promise.all(
      missing.map((month) =>
        financeService
          .getCreditCardInvoices(month)
          .then((statuses) => ({ month, summary: buildSummary(creditCards, statuses) }))
          .catch((error) => {
            console.error('Falha ao carregar resumo de faturas', error)
            return null
          }),
      ),
    ).then((results) => {
      if (cancelled) return
      setMonthSummaries((prev) => {
        const next = { ...prev }
        results.forEach((result) => {
          if (!result) return
          next[result.month] = result.summary
        })
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [recentMonths, selectedMonth, creditCards])

  const defaultAccountForOwner = (ownerId?: number, ownerName?: string) =>
    bankAccounts.find(
      (a) => a.active && (ownerId != null ? a.ownerId === ownerId : ownerName != null && a.owner === ownerName),
    )?.id ?? null

  const applyInvoiceUpdate = (updated: CreditCardInvoiceStatus) => {
    setInvoiceStatuses((prev) => {
      const next = { ...prev, [updated.creditCardId]: updated }
      setMonthSummaries((prevSummaries) => ({
        ...prevSummaries,
        [selectedMonth]: buildSummary(creditCards, Object.values(next)),
      }))
      return next
    })
  }

  const confirmPayInvoice = async (cardId: number, bankAccountId: number | null) => {
    setUpdatingCardId(cardId)
    setInvoiceError(null)
    try {
      const updated = await financeService.updateCreditCardInvoiceStatus(cardId, {
        referenceMonth: selectedMonth,
        paid: true,
        bankAccountId: bankAccountId ?? undefined,
      })
      applyInvoiceUpdate(updated)
      setPayModalCardId(null)
      setPayModalAccountId(null)
      await actions.refresh()
    } catch (error) {
      console.error(error)
      setInvoiceError(error instanceof Error ? error.message : 'Falha ao pagar fatura')
    } finally {
      setUpdatingCardId(null)
    }
  }

  const handleUnpayInvoice = async (cardId: number) => {
    if (!window.confirm('Desfazer pagamento? O lançamento de saída vinculado será removido.')) return
    setUpdatingCardId(cardId)
    setInvoiceError(null)
    try {
      const updated = await financeService.updateCreditCardInvoiceStatus(cardId, {
        referenceMonth: selectedMonth,
        paid: false,
      })
      applyInvoiceUpdate(updated)
      await actions.refresh()
    } catch (error) {
      console.error(error)
      setInvoiceError(error instanceof Error ? error.message : 'Falha ao desfazer pagamento')
    } finally {
      setUpdatingCardId(null)
    }
  }

  const handleInvoiceAction = (cardId: number) => {
    const status = invoiceStatuses[cardId]
    if (status?.paid) {
      void handleUnpayInvoice(cardId)
      return
    }
    const amount = status?.invoiceAmount ?? 0
    if (amount <= 0) {
      void confirmPayInvoice(cardId, null)
      return
    }
    const ownerId = status?.ownerId
    const card = creditCards.find((c) => c.id === cardId)
    setPayModalAccountId(defaultAccountForOwner(ownerId, card?.owner))
    setPayModalCardId(cardId)
  }

  const handleToggleAllInvoices = async (paid: boolean) => {
    if (paid) {
      handleOpenBulkPay()
      return
    }
    if (!window.confirm('Marcar todas como pendentes? Os lançamentos de pagamento serão removidos.')) return
    setBulkUpdating('reset')
    setInvoiceError(null)
    try {
      const updated = await financeService.updateAllCreditCardInvoices({
        referenceMonth: selectedMonth,
        paid: false,
      })
      const mapped = mapInvoicesByCard(updated)
      setInvoiceStatuses(mapped)
      setMonthSummaries((prev) => ({
        ...prev,
        [selectedMonth]: buildSummary(creditCards, updated),
      }))
      await actions.refresh()
    } catch (error) {
      console.error(error)
      setInvoiceError(error instanceof Error ? error.message : 'Falha ao atualizar faturas do mês')
    } finally {
      setBulkUpdating(null)
    }
  }

  const handleOpenBulkPay = () => {
    const initial: Record<number, number> = {}
    creditCards.forEach((card) => {
      const status = invoiceStatuses[card.id]
      if (!status?.paid && (status?.invoiceAmount ?? 0) > 0) {
        const accountId = defaultAccountForOwner(status.ownerId, card.owner)
        if (accountId) initial[card.id] = accountId
      }
    })
    setBulkAccountByCardId(initial)
    setBulkPayModalOpen(true)
  }

  const handleConfirmBulkPay = async () => {
    setBulkUpdating('pay')
    setInvoiceError(null)
    try {
      const updated = await financeService.updateAllCreditCardInvoices({
        referenceMonth: selectedMonth,
        paid: true,
        bankAccountIdByCardId: bulkAccountByCardId,
      })
      const mapped = mapInvoicesByCard(updated)
      setInvoiceStatuses(mapped)
      setMonthSummaries((prev) => ({
        ...prev,
        [selectedMonth]: buildSummary(creditCards, updated),
      }))
      setBulkPayModalOpen(false)
      await actions.refresh()
    } catch (error) {
      console.error(error)
      setInvoiceError(error instanceof Error ? error.message : 'Falha ao pagar faturas')
    } finally {
      setBulkUpdating(null)
    }
  }

  const handleShowReceipt = async (cardId: number) => {
    setReceiptLoading(true)
    setInvoiceError(null)
    try {
      const data = await financeService.getCreditCardInvoiceReceipt(cardId, selectedMonth)
      setReceipt(data)
    } catch (error) {
      console.error(error)
      setInvoiceError(error instanceof Error ? error.message : 'Falha ao carregar comprovante')
    } finally {
      setReceiptLoading(false)
    }
  }

  const payModalCard = payModalCardId != null ? creditCards.find((c) => c.id === payModalCardId) : null
  const payModalStatus = payModalCardId != null ? invoiceStatuses[payModalCardId] : null
  const payModalAccounts = useMemo(() => {
    if (!payModalCard) return []
    const ownerId = payModalStatus?.ownerId
    return bankAccounts.filter(
      (a) => a.active && (ownerId != null ? a.ownerId === ownerId : a.owner === payModalCard.owner),
    )
  }, [bankAccounts, payModalCard, payModalStatus?.ownerId])

  const cardExpenses = useMemo(() => {
    return creditCards.map((card) => {
      // Filtrar transações de crédito do mês selecionado que pertencem a este cartão
      const expenses = transactions
        .filter((transaction) => {
          // Verificar se é do mês selecionado
          if (transaction.competency !== selectedMonth) return false
          
          // Verificar se é despesa e método de pagamento crédito
          if (transaction.type !== 'Despesa' || transaction.paymentMethod !== 'Crédito') return false
          
          // Verificar se pertence ao cartão
          // O backend retorna creditCardId como número, mas também pode vir como creditCard (string)
          const transactionCardId = transaction.creditCardId ?? (transaction.creditCard ? Number(transaction.creditCard) : null)
          
          if (transactionCardId === null || transactionCardId === undefined) return false
          
          // Comparar IDs (ambos são números)
          return transactionCardId === card.id
        })
        .reduce((sum, transaction) => sum + transaction.value, 0)
      
      return {
        ...card,
        expenses,
        available: card.limit - expenses,
        usage: card.limit > 0 ? (expenses / card.limit) * 100 : 0,
      }
    })
  }, [creditCards, transactions, selectedMonth])

  // Gráfico comparativo de uso dos cartões
  const cardUsageChart = useMemo(() => {
    return cardExpenses.map((card) => ({
      name: card.name.length > 10 ? card.name.substring(0, 10) + '...' : card.name,
      usado: card.expenses,
      disponivel: card.available,
      limite: card.limit,
      uso: Math.min(card.usage, 100),
    }))
  }, [cardExpenses])

  const invoiceSummary = useMemo(() => buildSummary(creditCards, Object.values(invoiceStatuses)), [creditCards, invoiceStatuses])
  const hasPendingInvoices = invoiceSummary.pendingCount > 0
  const hasPaidInvoices = invoiceSummary.paidCount > 0

  const filteredCardExpenses = useMemo(() => {
    return cardExpenses.filter((card) => {
      const paid = invoiceStatuses[card.id]?.paid ?? false
      if (invoiceFilter === 'paid') return paid
      if (invoiceFilter === 'pending') return !paid
      return true
    })
  }, [cardExpenses, invoiceFilter, invoiceStatuses])

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const totalLimit = cardExpenses.reduce((sum, card) => sum + card.limit, 0)
    const totalExpenses = cardExpenses.reduce((sum, card) => sum + card.expenses, 0)
    const totalAvailable = cardExpenses.reduce((sum, card) => sum + card.available, 0)
    return {
      totalLimit,
      totalExpenses,
      totalAvailable,
      overallUsage: totalLimit > 0 ? (totalExpenses / totalLimit) * 100 : 0,
    }
  }, [cardExpenses])

  // Balanço de pagamentos entre pessoas
  const balanceByPerson = useMemo(() => {
    const realPersons = persons.filter((p) => p.active && !p.allowSplit)
    const byName = new Map(persons.map((p) => [p.name, p]))
    const byId = new Map(persons.map((p) => [p.id, p]))

    const incomeByPerson: Record<string, number> = {}
    const expensesByPerson: Record<string, number> = {}

    const monthTransactions = transactions.filter((t) => t.competency === selectedMonth)

    for (const transaction of monthTransactions) {
      const txPerson = byName.get(transaction.person)
      if (!txPerson) continue

      if (txPerson.allowSplit) {
        const allocations = allocateValueByPercentages(transaction.value, txPerson.splits || [])
        for (const [recipientIdStr, share] of Object.entries(allocations)) {
          if (!share) continue
          const recipient = byId.get(Number(recipientIdStr))
          if (!recipient || !recipient.active || recipient.allowSplit) continue

          if (transaction.type === 'Receita') {
            incomeByPerson[recipient.name] = (incomeByPerson[recipient.name] ?? 0) + share
          } else {
            expensesByPerson[recipient.name] = (expensesByPerson[recipient.name] ?? 0) + share
          }
        }
      } else {
        if (!txPerson.active || txPerson.allowSplit) continue

        if (transaction.type === 'Receita') {
          incomeByPerson[txPerson.name] = (incomeByPerson[txPerson.name] ?? 0) + transaction.value
        } else {
          expensesByPerson[txPerson.name] = (expensesByPerson[txPerson.name] ?? 0) + transaction.value
        }
      }
    }

    const result: Record<
      string,
      { income: number; expenses: number; balance: number; toPay: number; toReceive: number }
    > = {}
    for (const person of realPersons) {
      const income = incomeByPerson[person.name] ?? 0
      const expenses = expensesByPerson[person.name] ?? 0
      const balance = income - expenses
      result[person.name] = {
        income,
        expenses,
        balance,
        toPay: balance < 0 ? Math.abs(balance) : 0,
        toReceive: balance > 0 ? balance : 0,
      }
    }

    return result
  }, [transactions, persons, selectedMonth])

  const balanceEntriesSorted = useMemo(() => {
    return Object.entries(balanceByPerson).sort(([nameA, a], [nameB, b]) => {
      if (b.toPay !== a.toPay) return b.toPay - a.toPay
      if (b.toReceive !== a.toReceive) return b.toReceive - a.toReceive
      return nameA.localeCompare(nameB, 'pt-BR')
    })
  }, [balanceByPerson])

  const balanceTotals = useMemo(() => {
    const values = Object.values(balanceByPerson)
    return {
      totalToPay: values.reduce((s, p) => s + p.toPay, 0),
      totalToReceive: values.reduce((s, p) => s + p.toReceive, 0),
    }
  }, [balanceByPerson])

  const twoPersonSettlement = useMemo(() => {
    const entries = balanceEntriesSorted
    if (entries.length !== 2) return null
    const [e1, e2] = entries
    const [name1, d1] = e1
    const [name2, d2] = e2
    if (d1.toPay > 0 && d2.toReceive > 0) {
      const amount = Math.min(d1.toPay, d2.toReceive)
      return { from: name1, to: name2, amount }
    }
    if (d2.toPay > 0 && d1.toReceive > 0) {
      const amount = Math.min(d2.toPay, d1.toReceive)
      return { from: name2, to: name1, amount }
    }
    return null
  }, [balanceEntriesSorted])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Fechamento mensal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe cartões de crédito e finalize o mês selecionado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MonthYearSelector value={selectedMonth} onChange={onMonthChange} />
          {isClosed ? (
            <button
              onClick={() => actions.reopenMonth(selectedMonth)}
              className="px-4 py-2 bg-warning text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Reabrir mês
            </button>
          ) : (
            <button
              onClick={() => actions.closeMonth(selectedMonth)}
              className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Fechar mês
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Balanço por pessoa — {selectedMonth}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Receitas e despesas já incluem o rateio da conta fixa (distribuidora). “A pagar” é o valor para equilibrar o mês entre vocês.
          </p>
        </div>

        {balanceEntriesSorted.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30 px-3 py-2">
                <p className="text-xs text-red-800 dark:text-red-300">Total a pagar (soma dos déficits)</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatBRL(balanceTotals.totalToPay)}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-2">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">Total a receber (soma dos créditos)</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatBRL(balanceTotals.totalToReceive)}</p>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/60 text-left text-gray-600 dark:text-gray-300">
                    <th className="px-3 py-2 font-medium">Pessoa</th>
                    <th className="px-3 py-2 font-medium text-right">Receitas</th>
                    <th className="px-3 py-2 font-medium text-right">Despesas</th>
                    <th className="px-3 py-2 font-medium text-right">Saldo</th>
                    <th className="px-3 py-2 font-medium text-right">A pagar</th>
                    <th className="px-3 py-2 font-medium text-right">Crédito</th>
                    <th className="px-3 py-2 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceEntriesSorted.map(([personName, row]) => {
                    const situation =
                      row.toPay > 0 ? 'deve' : row.toReceive > 0 ? 'credito' : 'ok'
                    return (
                      <tr
                        key={personName}
                        className="border-t border-gray-100 dark:border-slate-600 hover:bg-gray-50/80 dark:hover:bg-slate-700/40"
                      >
                        <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-100">{personName}</td>
                        <td className="px-3 py-2 text-right text-green-700 dark:text-green-400 tabular-nums">
                          {formatBRL(row.income)}
                        </td>
                        <td className="px-3 py-2 text-right text-red-700 dark:text-red-400 tabular-nums">
                          {formatBRL(row.expenses)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-medium tabular-nums ${
                            row.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          {formatBRL(row.balance)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-700 dark:text-red-400 tabular-nums">
                          {row.toPay > 0 ? formatBRL(row.toPay) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {row.toReceive > 0 ? formatBRL(row.toReceive) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {situation === 'deve' && (
                            <span className="inline-flex rounded-full bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-2 py-0.5 text-xs font-medium">
                              Deve pagar
                            </span>
                          )}
                          {situation === 'credito' && (
                            <span className="inline-flex rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 text-xs font-medium">
                              Em crédito
                            </span>
                          )}
                          {situation === 'ok' && (
                            <span className="inline-flex rounded-full bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-200 px-2 py-0.5 text-xs font-medium">
                              Equilibrado
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3 mb-4">
              {balanceEntriesSorted.map(([personName, row]) => {
                const maxFlow = Math.max(row.income, row.expenses, 1)
                const incomePct = (row.income / maxFlow) * 100
                const expensePct = (row.expenses / maxFlow) * 100
                return (
                  <div
                    key={personName}
                    className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 bg-gray-50/80 dark:bg-slate-700/40"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">{personName}</h4>
                      {row.toPay > 0 && (
                        <span className="shrink-0 rounded-full bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-2 py-0.5 text-xs font-medium">
                          Deve pagar
                        </span>
                      )}
                      {row.toPay === 0 && row.toReceive > 0 && (
                        <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 text-xs font-medium">
                          Em crédito
                        </span>
                      )}
                      {row.toPay === 0 && row.toReceive === 0 && (
                        <span className="shrink-0 rounded-full bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 px-2 py-0.5 text-xs font-medium">
                          Equilibrado
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm mb-3">
                      <div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                          <span>Receitas</span>
                          <span className="font-semibold text-green-700 dark:text-green-400 tabular-nums">
                            {formatBRL(row.income)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${incomePct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                          <span>Despesas</span>
                          <span className="font-semibold text-red-700 dark:text-red-400 tabular-nums">
                            {formatBRL(row.expenses)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                          <div className="h-full rounded-full bg-red-500" style={{ width: `${expensePct}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-200 dark:border-slate-600 pt-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Saldo</p>
                        <p
                          className={`font-bold tabular-nums ${
                            row.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          {formatBRL(row.balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Acerto</p>
                        {row.toPay > 0 ? (
                          <p className="font-bold text-red-700 dark:text-red-400 tabular-nums">{formatBRL(row.toPay)} a pagar</p>
                        ) : row.toReceive > 0 ? (
                          <p className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatBRL(row.toReceive)} a receber</p>
                        ) : (
                          <p className="font-medium text-gray-600 dark:text-gray-300">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {twoPersonSettlement && twoPersonSettlement.amount > 0 && (
              <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/40 p-4 mb-4">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-1">Sugestão de acerto (2 pessoas)</p>
                <p className="text-base text-indigo-950 dark:text-indigo-50">
                  <strong>{twoPersonSettlement.from}</strong> transfere{' '}
                  <strong className="tabular-nums">{formatBRL(twoPersonSettlement.amount)}</strong> para{' '}
                  <strong>{twoPersonSettlement.to}</strong>.
                </p>
              </div>
            )}

            {Object.values(balanceByPerson).some((p) => p.toPay > 0) && (
              <div className="border-2 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
                <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Resumo rápido</p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {balanceEntriesSorted
                    .filter(([, data]) => data.toPay > 0)
                    .map(([name, data]) => (
                      <li key={name}>
                        <strong>{name}</strong>: pagar <strong className="text-red-600 dark:text-red-400 tabular-nums">{formatBRL(data.toPay)}</strong>
                      </li>
                    ))}
                  {balanceEntriesSorted
                    .filter(([, data]) => data.toReceive > 0)
                    .map(([name, data]) => (
                      <li key={`recv-${name}`}>
                        <strong>{name}</strong>: receber <strong className="text-emerald-700 dark:text-emerald-400 tabular-nums">{formatBRL(data.toReceive)}</strong>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {Object.values(balanceByPerson).every((p) => p.toPay === 0) && Object.values(balanceByPerson).length > 0 && (
              <div className="border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 rounded-lg p-4 mt-4">
                <p className="font-semibold text-green-800 dark:text-green-300">
                  Ninguém precisa pagar acerto neste mês (saldos equilibrados ou todos em crédito/zero).
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
            Nenhuma pessoa real ativa encontrada. Cadastre pessoas sem “distribuir valores” nas configurações.
          </div>
        )}
      </div>

      {/* Facilitador de faturas */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700 space-y-3">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Status das faturas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Controle rápido das faturas de {selectedMonth}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {invoiceSummary.paidCount}/{invoiceSummary.totalCards}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Faturas pagas</p>
          </div>
        </div>
        <div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-emerald-500 transition-all"
              style={{ width: `${invoiceSummary.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {invoiceSummary.pendingCount} pendente(s)
          </p>
        </div>
        {invoiceLoading && <p className="text-xs text-gray-500">Atualizando status das faturas...</p>}
        {invoiceError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded p-2">
            {invoiceError}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-700 pt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use os atalhos para pagar faturas (gera lançamento de saída na conta do titular) ou reverter pagamentos.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleToggleAllInvoices(true)}
              disabled={bulkUpdating !== null || !hasPendingInvoices || invoiceLoading || creditCards.length === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white disabled:opacity-60"
            >
              {bulkUpdating === 'pay' ? 'Aplicando...' : 'Pagar todas as faturas'}
            </button>
            <button
              onClick={() => handleToggleAllInvoices(false)}
              disabled={bulkUpdating !== null || !hasPaidInvoices || invoiceLoading || creditCards.length === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-60"
            >
              {bulkUpdating === 'reset' ? 'Atualizando...' : 'Marcar todas como pendentes'}
            </button>
          </div>
        </div>
      </div>

      {/* Histórico de faturas por mês */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Histórico de faturas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Visualize rapidamente o status dos últimos meses.</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {recentMonths.map((month) => {
            const summary = monthSummaries[month]
            const isActive = month === selectedMonth
            const pending = summary?.pendingCount ?? null
            return (
              <button
                key={month}
                onClick={() => month !== selectedMonth && onMonthChange(month)}
                className={`min-w-[150px] rounded-xl border px-4 py-3 text-left transition-colors ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{formatMonthLabel(month)}</p>
                {summary ? (
                  <>
                    {summary.totalCards > 0 ? (
                      <>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {summary.paidCount}/{summary.totalCards} pagas
                        </p>
                        {pending && pending > 0 ? (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            {pending} pendente(s)
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            ✓ Tudo pago
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500">Sem cartões</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500">Carregando...</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Limite Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {totalStats.totalLimit.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gasto Total</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {totalStats.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Disponível Total</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {totalStats.totalAvailable.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Uso Geral</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalStats.overallUsage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Gráficos */}
      {cardExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico comparativo de uso dos cartões */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Uso dos Cartões</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardUsageChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'uso') return `${value.toFixed(1)}%`
                    return `R$ ${value.toFixed(2)}`
                  }}
                />
                <Legend />
                <Bar dataKey="usado" fill="#ef4444" name="Usado" />
                <Bar dataKey="disponivel" fill="#10b981" name="Disponível" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de percentual de uso */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Percentual de Uso</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardUsageChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="uso" fill="#8b5cf6" name="Uso (%)">
                  {cardUsageChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.uso > 90 ? '#ef4444' : entry.uso > 70 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {invoiceFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setInvoiceFilter(option.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                invoiceFilter === option.value
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                  : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Exibindo {filteredCardExpenses.length} de {cardExpenses.length} cartões
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCardExpenses.map((card) => (
          <div
            key={card.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-100 dark:border-slate-700 space-y-3"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{card.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{card.owner}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  card.usage > 90 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                    : card.usage > 70 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}
              >
                {card.usage.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p>
                Gasto no mês: <strong className="text-red-600 dark:text-red-400">R$ {card.expenses.toFixed(2)}</strong>
              </p>
              <p>
                Limite total: <strong className="text-gray-800 dark:text-gray-100">R$ {card.limit.toFixed(2)}</strong>
              </p>
              <p>
                Disponível: <strong className="text-green-600 dark:text-green-400">R$ {card.available.toFixed(2)}</strong>
              </p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  card.usage > 90 ? 'bg-red-500' : card.usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(card.usage, 100)}%` }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    invoiceStatuses[card.id]?.paid
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {invoiceStatuses[card.id]?.paid ? 'Fatura paga' : 'Fatura pendente'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {invoiceStatuses[card.id]?.paid && (
                    <button
                      type="button"
                      onClick={() => void handleShowReceipt(card.id)}
                      disabled={receiptLoading}
                      className="text-xs px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-60"
                    >
                      Comprovante
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleInvoiceAction(card.id)}
                    disabled={updatingCardId === card.id}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60"
                  >
                    {invoiceStatuses[card.id]?.paid ? 'Desfazer pagamento' : 'Pagar fatura'}
                  </button>
                </div>
              </div>
              {invoiceStatuses[card.id]?.paid && invoiceStatuses[card.id]?.bankAccountName && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Debitado de {invoiceStatuses[card.id]?.bankAccountName}
                  {invoiceStatuses[card.id]?.invoiceAmount != null && (
                    <> — {formatBRL(Number(invoiceStatuses[card.id]?.invoiceAmount))}</>
                  )}
                </p>
              )}
              {invoiceStatuses[card.id]?.paidAt && (() => {
                try {
                  const paidAt = invoiceStatuses[card.id]!.paidAt!
                  
                  // Verifica se paidAt é válido
                  if (!paidAt) {
                    return null
                  }
                  
                  // Tenta parsear a data que pode vir como string ISO ou array do LocalDateTime
                  let date: Date
                  
                  if (typeof paidAt === 'string') {
                    // Se for string, tenta parsear diretamente
                    date = new Date(paidAt)
                  } else if (Array.isArray(paidAt) && paidAt.length >= 3) {
                    // Se for array [ano, mês, dia, hora, minuto, segundo] do LocalDateTime
                    const year = Number(paidAt[0]) || 0
                    const month = Number(paidAt[1]) || 0
                    const day = Number(paidAt[2]) || 0
                    const hour = Number(paidAt[3]) || 0
                    const minute = Number(paidAt[4]) || 0
                    const second = Number(paidAt[5]) || 0
                    date = new Date(year, month - 1, day, hour, minute, second)
                  } else {
                    // Fallback: tenta criar Date diretamente
                    date = new Date(String(paidAt))
                  }
                  
                  // Verifica se a data é válida
                  if (isNaN(date.getTime())) {
                    return null
                  }
                  
                  return (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pago em {date.toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )
                } catch (error) {
                  console.error('Erro ao formatar data:', error)
                  return null
                }
              })()}
            </div>
          </div>
        ))}
      </div>
      {filteredCardExpenses.length === 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6">
          Nenhum cartão corresponde ao filtro selecionado.
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Meses fechados</h3>
        {closedMonths.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum mês foi fechado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {closedMonths.map((month) => (
              <span key={month} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-sm text-gray-700 dark:text-gray-300">
                {month}
              </span>
            ))}
          </div>
        )}
      </div>

      <SinglePayModal
        open={payModalCardId != null}
        cardName={payModalCard?.name ?? ''}
        ownerName={payModalCard?.owner ?? ''}
        amount={payModalStatus?.invoiceAmount ?? 0}
        accounts={payModalAccounts}
        selectedAccountId={payModalAccountId}
        onSelectAccount={setPayModalAccountId}
        onConfirm={() => payModalCardId != null && void confirmPayInvoice(payModalCardId, payModalAccountId)}
        onClose={() => {
          setPayModalCardId(null)
          setPayModalAccountId(null)
        }}
        loading={updatingCardId === payModalCardId}
      />

      <BulkPayModal
        open={bulkPayModalOpen}
        cards={creditCards}
        invoiceStatuses={invoiceStatuses}
        bankAccounts={bankAccounts}
        accountByCardId={bulkAccountByCardId}
        onSelectAccount={(cardId, accountId) =>
          setBulkAccountByCardId((prev) => ({ ...prev, [cardId]: accountId }))
        }
        onConfirm={() => void handleConfirmBulkPay()}
        onClose={() => setBulkPayModalOpen(false)}
        loading={bulkUpdating === 'pay'}
      />

      <ReceiptModal
        open={receipt != null}
        receipt={receipt}
        onClose={() => setReceipt(null)}
      />
    </div>
  )
}

