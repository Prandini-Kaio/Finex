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

interface ClosureViewProps {
  selectedMonth: string
  onMonthChange: (value: string) => void
  transactions: Transaction[]
}

export const ClosureView: React.FC<ClosureViewProps> = ({ selectedMonth, onMonthChange, transactions }) => {
  const {
    state: { creditCards, closedMonths, transactions: allTransactions },
    actions,
  } = useFinance()

  const [invoiceStatuses, setInvoiceStatuses] = useState<Record<number, CreditCardInvoiceStatus>>({})
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [updatingCardId, setUpdatingCardId] = useState<number | null>(null)
  const [bulkUpdating, setBulkUpdating] = useState<'pay' | 'reset' | null>(null)
  const [monthSummaries, setMonthSummaries] = useState<Record<string, MonthSummary>>({})
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all')

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

  const handleToggleInvoice = async (cardId: number) => {
    const currentPaid = invoiceStatuses[cardId]?.paid ?? false
    setUpdatingCardId(cardId)
    setInvoiceError(null)
    try {
      const updated = await financeService.updateCreditCardInvoiceStatus(cardId, {
        referenceMonth: selectedMonth,
        paid: !currentPaid,
      })
      setInvoiceStatuses((prev) => {
        const next = {
          ...prev,
          [cardId]: updated,
        }
        setMonthSummaries((prevSummaries) => ({
          ...prevSummaries,
          [selectedMonth]: buildSummary(creditCards, Object.values(next)),
        }))
        return next
      })
    } catch (error) {
      console.error(error)
      setInvoiceError(error instanceof Error ? error.message : 'Falha ao atualizar status da fatura')
    } finally {
      setUpdatingCardId(null)
    }
  }

  const handleToggleAllInvoices = async (paid: boolean) => {
    setBulkUpdating(paid ? 'pay' : 'reset')
    setInvoiceError(null)
    try {
      const updated = await financeService.updateAllCreditCardInvoices({
        referenceMonth: selectedMonth,
        paid,
      })
      const mapped = mapInvoicesByCard(updated)
      setInvoiceStatuses(mapped)
      setMonthSummaries((prev) => ({
        ...prev,
        [selectedMonth]: buildSummary(creditCards, updated),
      }))
    } catch (error) {
      console.error(error)
      setInvoiceError(error instanceof Error ? error.message : 'Falha ao atualizar faturas do mês')
    } finally {
      setBulkUpdating(null)
    }
  }

  const cardExpenses = useMemo(() => {
    return creditCards.map((card) => {
      // Filtrar transações de crédito do mês selecionado que pertencem a este cartão
      const expenses = allTransactions
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
  }, [creditCards, allTransactions, selectedMonth])

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
    // Despesas de Kaio (incluindo metade das despesas "Ambos")
    const kaioExpenses = transactions
      .filter((t) => t.type === 'Despesa' && (t.person === 'Kaio' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    // Receitas de Kaio (incluindo metade das receitas "Ambos")
    const kaioIncome = transactions
      .filter((t) => t.type === 'Receita' && (t.person === 'Kaio' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    // Despesas de Gabriela (incluindo metade das despesas "Ambos")
    const gabrielaExpenses = transactions
      .filter((t) => t.type === 'Despesa' && (t.person === 'Gabriela' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    // Receitas de Gabriela (incluindo metade das receitas "Ambos")
    const gabrielaIncome = transactions
      .filter((t) => t.type === 'Receita' && (t.person === 'Gabriela' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    const kaioBalance = kaioIncome - kaioExpenses
    const gabrielaBalance = gabrielaIncome - gabrielaExpenses

    // Quanto cada um deve pagar (apenas informativo, sem calcular transferências)
    const kaioToPay = kaioBalance < 0 ? Math.abs(kaioBalance) : 0
    const gabrielaToPay = gabrielaBalance < 0 ? Math.abs(gabrielaBalance) : 0

    return {
      kaio: {
        expenses: kaioExpenses,
        income: kaioIncome,
        balance: kaioBalance,
        toPay: kaioToPay,
      },
      gabriela: {
        expenses: gabrielaExpenses,
        income: gabrielaIncome,
        balance: gabrielaBalance,
        toPay: gabrielaToPay,
      },
    }
  }, [transactions])

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

      {/* Balanço de Pagamentos - No topo */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Balanço de Pagamentos - {selectedMonth}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Kaio */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Kaio</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Receitas:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">R$ {balanceByPerson.kaio.income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Despesas:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">R$ {balanceByPerson.kaio.expenses.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Saldo:</span>
                <span
                  className={`font-bold ${
                    balanceByPerson.kaio.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  R$ {balanceByPerson.kaio.balance.toFixed(2)}
                </span>
              </div>
              {balanceByPerson.kaio.toPay > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700 dark:text-red-400 font-medium">A pagar:</span>
                    <span className="font-bold text-lg text-red-600 dark:text-red-400">R$ {balanceByPerson.kaio.toPay.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gabriela */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Gabriela</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Receitas:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">R$ {balanceByPerson.gabriela.income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Despesas:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">R$ {balanceByPerson.gabriela.expenses.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Saldo:</span>
                <span
                  className={`font-bold ${
                    balanceByPerson.gabriela.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  R$ {balanceByPerson.gabriela.balance.toFixed(2)}
                </span>
              </div>
              {balanceByPerson.gabriela.toPay > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700 dark:text-red-400 font-medium">A pagar:</span>
                    <span className="font-bold text-lg text-red-600 dark:text-red-400">R$ {balanceByPerson.gabriela.toPay.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo informativo */}
        {(balanceByPerson.kaio.toPay > 0 || balanceByPerson.gabriela.toPay > 0) && (
          <div className="border-2 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">Resumo do Fechamento:</p>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {balanceByPerson.kaio.toPay > 0 && (
                <p>
                  • <strong>Kaio</strong> deve pagar: <strong className="text-red-600 dark:text-red-400">R$ {balanceByPerson.kaio.toPay.toFixed(2)}</strong>
                </p>
              )}
              {balanceByPerson.gabriela.toPay > 0 && (
                <p>
                  • <strong>Gabriela</strong> deve pagar: <strong className="text-red-600 dark:text-red-400">R$ {balanceByPerson.gabriela.toPay.toFixed(2)}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {balanceByPerson.kaio.toPay === 0 && balanceByPerson.gabriela.toPay === 0 && (
          <div className="border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <p className="font-semibold text-green-700 dark:text-green-400">✓ Ambos estão com saldo positivo! Nenhum pagamento necessário.</p>
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
            Use os atalhos para marcar todas as faturas conforme o status real do mês.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleToggleAllInvoices(true)}
              disabled={bulkUpdating !== null || !hasPendingInvoices || invoiceLoading || creditCards.length === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white disabled:opacity-60"
            >
              {bulkUpdating === 'pay' ? 'Aplicando...' : 'Marcar todas como pagas'}
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
                <button
                  onClick={() => handleToggleInvoice(card.id)}
                  disabled={updatingCardId === card.id}
                  className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60"
                >
                  {invoiceStatuses[card.id]?.paid ? 'Marcar como não paga' : 'Marcar como paga'}
                </button>
              </div>
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
    </div>
  )
}

