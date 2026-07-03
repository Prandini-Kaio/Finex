import { useMemo, useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Upload, Download, FileDown, Edit, Package } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { useFilters } from '../context/FilterContext'
import type { Transaction } from '../types/finance'
import { getInstallmentPreview } from '../utils/finance'
import { MonthYearSelector } from '../components/MonthYearSelector'
import { FilterBar } from '../components/filters/FilterBar'
import { TransactionForm } from '../components/transactions/TransactionForm'
import { Modal } from '../components/ui/Modal'
import { financeService } from '../services/financeService'

export const TransactionsView: React.FC = () => {
  const { filters, selectedMonth } = useFilters()
  const {
    state: { categories, creditCards, closedMonths, transactions: allTransactions },
    actions,
  } = useFinance()

  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  const [exportAll, setExportAll] = useState(true)
  const [importResult, setImportResult] = useState<{
    totalProcessed: number
    successCount: number
    errorCount: number
    errors: string[]
  } | null>(null)
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false)
  const [editingInstallmentsParentId, setEditingInstallmentsParentId] = useState<number | null>(null)
  const [installmentsList, setInstallmentsList] = useState<Transaction[]>([])
  const [editInstallmentsTotalValue, setEditInstallmentsTotalValue] = useState('')
  const [editInstallmentsPurchaseDate, setEditInstallmentsPurchaseDate] = useState('')
  const [anticipateFrom, setAnticipateFrom] = useState('1')
  const [anticipateTo, setAnticipateTo] = useState('2')
  const [anticipateUseTargetCompetency, setAnticipateUseTargetCompetency] = useState(false)
  const [anticipateTargetCompetency, setAnticipateTargetCompetency] = useState('')
  const [anticipateSubmitting, setAnticipateSubmitting] = useState(false)
  const [deleteChoiceTransaction, setDeleteChoiceTransaction] = useState<Transaction | null>(null)
  const [editInstallmentsCount, setEditInstallmentsCount] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    try {
      const data = await financeService.getTransactions(filters)
      setTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar lançamentos filtrados:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }, [filters])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions, allTransactions])

  const isMonthClosed = closedMonths.some((month) =>
    filters.competencies.length > 0 ? filters.competencies.includes(month) : month === selectedMonth,
  )

  const editingTransaction = useMemo(
    () => (editingTransactionId ? allTransactions.find((t) => t.id === editingTransactionId) : undefined),
    [allTransactions, editingTransactionId],
  )

  const isEditingInstallmentGroup =
    !!editingTransaction?.parentPurchase && editingTransaction.totalInstallments > 1

  const sortedInstallmentsModal = useMemo(() => {
    return [...installmentsList].sort((a, b) => a.installmentNumber - b.installmentNumber)
  }, [installmentsList])

  const canAnticipateCredit =
    sortedInstallmentsModal.length >= 2 &&
    sortedInstallmentsModal.every((t) => t.paymentMethod === 'Crédito')

  const installmentsModalResizePreview = useMemo(() => {
    if (!editInstallmentsPurchaseDate || !editInstallmentsTotalValue) return null
    const n = parseInt(editInstallmentsCount, 10)
    if (Number.isNaN(n) || n < 1) return null
    return getInstallmentPreview(editInstallmentsPurchaseDate, Number(editInstallmentsTotalValue), n)
  }, [editInstallmentsPurchaseDate, editInstallmentsTotalValue, editInstallmentsCount])

  const anticipateMergedPreview = useMemo(() => {
    const fromN = parseInt(anticipateFrom, 10)
    const toN = parseInt(anticipateTo, 10)
    if (Number.isNaN(fromN) || Number.isNaN(toN) || fromN >= toN) return null
    let sum = 0
    for (const t of sortedInstallmentsModal) {
      if (t.installmentNumber >= fromN && t.installmentNumber <= toN) sum += t.value
    }
    return sum
  }, [anticipateFrom, anticipateTo, sortedInstallmentsModal])

  const handleOpenModal = () => {
    if (!isMonthClosed) {
      setEditingTransactionId(null)
      setShowModal(true)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    if (isMonthClosed) return
    if (transaction.parentPurchase && transaction.totalInstallments > 1 && transaction.installmentNumber !== 1) {
      return
    }
    setEditingTransactionId(transaction.id)
    setShowModal(true)
  }

  const transactionRows = useMemo(
    () =>
      transactions.map((transaction) => {
        const cardName =
          transaction.paymentMethod === 'Crédito'
            ? creditCards.find((card) => String(card.id) === transaction.creditCard)?.name
            : null
        return { ...transaction, cardName }
      }),
    [transactions, creditCards],
  )

  // Calcular totais das transações filtradas
  const totals = useMemo(() => {
    const expenses = transactionRows
      .filter((t) => t.type === 'Despesa')
      .reduce((sum, t) => sum + t.value, 0)
    const income = transactionRows
      .filter((t) => t.type === 'Receita')
      .reduce((sum, t) => sum + t.value, 0)
    const balance = income - expenses
    return { expenses, income, balance }
  }, [transactionRows])

  // Estatísticas para gráficos
  const stats = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'Despesa').reduce((sum, t) => sum + t.value, 0)
    const income = transactions.filter((t) => t.type === 'Receita').reduce((sum, t) => sum + t.value, 0)

    const byPaymentMethod = transactions
      .filter((t) => t.type === 'Despesa')
      .reduce<Record<string, number>>((acc, transaction) => {
        acc[transaction.paymentMethod] = (acc[transaction.paymentMethod] || 0) + transaction.value
        return acc
      }, {})

    const byDay = transactions.reduce<Record<string, { expenses: number; income: number }>>((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (!acc[date]) {
        acc[date] = { expenses: 0, income: 0 }
      }
      if (transaction.type === 'Despesa') {
        acc[date].expenses += transaction.value
      } else {
        acc[date].income += transaction.value
      }
      return acc
    }, {})

    const installmentStats = transactions
      .filter((t) => t.totalInstallments > 1)
      .reduce<Record<number, number>>((acc, transaction) => {
        acc[transaction.totalInstallments] = (acc[transaction.totalInstallments] || 0) + 1
        return acc
      }, {})

    return {
      expenses,
      income,
      byPaymentMethod,
      byDay,
      installmentStats,
    }
  }, [transactions])

  // Gráfico de despesas vs receitas
  const incomeExpenseChart = useMemo(() => {
    return [
      { name: 'Receitas', value: stats.income, fill: '#10b981' },
      { name: 'Despesas', value: stats.expenses, fill: '#ef4444' },
    ]
  }, [stats])

  // Gráfico de despesas por método de pagamento
  const paymentMethodChart = useMemo(() => {
    return Object.entries(stats.byPaymentMethod).map(([name, value]) => ({
      name,
      value,
    }))
  }, [stats])

  // Gráfico de transações diárias
  const dailyTransactionsChart = useMemo(() => {
    return Object.entries(stats.byDay)
      .map(([date, data]) => ({
        date,
        receitas: data.income,
        despesas: data.expenses,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'))
        const dateB = new Date(b.date.split('/').reverse().join('-'))
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-15) // Últimos 15 dias
  }, [stats])

  // Gráfico de distribuição de parcelas
  const installmentChart = useMemo(() => {
    return Object.entries(stats.installmentStats)
      .map(([installments, count]) => ({
        name: `${installments}x`,
        value: count,
      }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name))
  }, [stats])

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault?.()
    event.stopPropagation?.()
    
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    console.log('Arquivo selecionado:', file.name, 'Tamanho:', file.size)
    
    setImporting(true)
    setImportResult(null)
    
    try {
      console.log('Chamando actions.importTransactions...')
      const result = await actions.importTransactions(file)
      console.log('Importação concluída:', result)
      setImportResult(result)
      if (result.errorCount === 0) {
        setTimeout(() => {
          setShowImportModal(false)
          setImportResult(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      setImportResult({
        totalProcessed: 0,
        successCount: 0,
        errorCount: 1,
        errors: [error instanceof Error ? error.message : 'Erro ao importar arquivo'],
      })
    } finally {
      setImporting(false)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
    
    return false
  }

  const downloadTemplate = () => {
    const template = `data,tipo,metodoPagamento,pessoa,categoria,descricao,valor,competencia,cartaoCredito,parcelas
19/11/2025,Despesa,Crédito,Kaio,Alimentação,Supermercado,150.50,11/2025,Nubank,1
20/11/2025,Receita,PIX,Gabriela,Salário,Salário mensal,5000.00,11/2025,,1`
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template_importacao_lancamentos.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Lançamentos</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-success text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            disabled={isMonthClosed}
          >
            <Upload size={20} /> Importar CSV
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <FileDown size={20} /> Exportar CSV
          </button>
          <button
            onClick={handleOpenModal}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isMonthClosed
                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed'
                : 'bg-primary text-white hover:opacity-90 transition-opacity'
            }`}
            disabled={isMonthClosed}
            type="button"
          >
            <Plus size={20} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Gráficos */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico de receitas vs despesas */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Receitas vs Despesas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incomeExpenseChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Bar dataKey="value">
                  {incomeExpenseChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de despesas por método de pagamento */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Despesas por Método de Pagamento</h3>
            {paymentMethodChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentMethodChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                  >
                    {paymentMethodChart.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">Nenhuma despesa registrada</p>
            )}
          </div>

          {/* Gráfico de transações diárias */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Transações Diárias (Últimos 15 dias)</h3>
            {dailyTransactionsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyTransactionsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Receitas"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Despesas"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">Nenhuma transação registrada</p>
            )}
          </div>

          {/* Gráfico de distribuição de parcelas */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Distribuição de Parcelas</h3>
            {installmentChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={installmentChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value} transação(ões)`} />
                  <Bar dataKey="value" fill="#8b5cf6" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">Nenhuma transação parcelada</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4 border border-gray-200 dark:border-slate-700">
        <FilterBar />

        {loadingTransactions && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando lançamentos...</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Data</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Pessoa</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Categoria</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Pagamento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Parcelas</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Valor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {transactionRows.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        transaction.type === 'Despesa' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{transaction.person}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{transaction.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{transaction.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {transaction.paymentMethod}
                    {transaction.cardName && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({transaction.cardName})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {transaction.totalInstallments > 1 ? (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                        {transaction.installmentNumber}/{transaction.totalInstallments}x
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">À vista</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">R$ {transaction.value.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {transaction.parentPurchase && transaction.installmentNumber === 1 && (
                        <button
                          onClick={async () => {
                            if (!transaction.parentPurchase) return
                            const installments = await actions.getInstallments(transaction.parentPurchase)
                            setInstallmentsList(installments)
                            const totalValue = installments.reduce((sum, t) => sum + t.value, 0)
                            setEditInstallmentsTotalValue(totalValue.toFixed(2))
                            setEditInstallmentsPurchaseDate(transaction.date)
                            setEditingInstallmentsParentId(transaction.parentPurchase)
                            const sorted = [...installments].sort((a, b) => a.installmentNumber - b.installmentNumber)
                            const n = sorted.length
                            setAnticipateFrom('1')
                            setAnticipateTo(n >= 2 ? '2' : '1')
                            setAnticipateUseTargetCompetency(false)
                            setAnticipateTargetCompetency(sorted[0]?.competency ?? '')
                            setEditInstallmentsCount(String(n))
                            setShowInstallmentsModal(true)
                          }}
                          disabled={isMonthClosed}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Editar compra parcelada"
                        >
                          <Package size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(transaction)}
                        disabled={
                          isMonthClosed ||
                          (!!transaction.parentPurchase &&
                            transaction.totalInstallments > 1 &&
                            transaction.installmentNumber !== 1)
                        }
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          transaction.parentPurchase &&
                          transaction.totalInstallments > 1 &&
                          transaction.installmentNumber !== 1
                            ? 'Edite pela 1ª parcela ou pelo ícone do pacote'
                            : 'Editar lançamento'
                        }
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            transaction.parentPurchase &&
                            transaction.totalInstallments > 1
                          ) {
                            setDeleteChoiceTransaction(transaction)
                          } else if (confirm('Excluir este lançamento?')) {
                            void actions.deleteTransaction(transaction.id)
                          }
                        }}
                        disabled={isMonthClosed}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Excluir lançamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {transactionRows.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-slate-700 border-t-2 border-gray-300 dark:border-slate-600">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total de Despesas:
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                    R$ {totals.expenses.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total de Receitas:
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                    R$ {totals.income.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
                <tr className="bg-gray-100 dark:bg-slate-600">
                  <td colSpan={7} className="px-4 py-3 text-right text-sm font-bold text-gray-800 dark:text-gray-200">
                    Saldo:
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold ${
                    totals.balance >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    R$ {totals.balance.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
          {transactionRows.length === 0 && (
            <p className="text-center py-8 text-gray-400 dark:text-gray-500">Nenhum lançamento encontrado</p>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingTransactionId(null)
        }}
        title={editingTransactionId ? 'Editar lançamento' : 'Novo lançamento'}
        maxWidth="max-w-2xl"
      >
        {isEditingInstallmentGroup && (
          <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-4">
            Compra parcelada: altere valor e parcelas pelo ícone do pacote na 1ª parcela.
          </p>
        )}
        <TransactionForm
          defaultDate={new Date().toISOString().split('T')[0]}
          defaultCategory={categories[0]}
          editingTransaction={editingTransaction}
          onSuccess={() => {
            setShowModal(false)
            setEditingTransactionId(null)
            void loadTransactions()
          }}
          onCancel={() => {
            setShowModal(false)
            setEditingTransactionId(null)
          }}
        />
      </Modal>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Importar Lançamentos via CSV</h2>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-2">Formato do CSV:</p>
              <p className="mb-1">Colunas: data, tipo, metodoPagamento, pessoa, categoria, descricao, valor, competencia, cartaoCredito (opcional), parcelas (opcional)</p>
              <p className="mb-1">• Data: DD/MM/YYYY ou YYYY-MM-DD</p>
              <p className="mb-1">• Tipo: Despesa ou Receita</p>
              <p className="mb-1">• Método de Pagamento: Crédito, Débito, PIX ou Dinheiro</p>
              <p className="mb-1">• Pessoa: Kaio, Gabriela ou Ambos</p>
              <p className="mb-1">• Valor: use ponto ou vírgula como separador decimal</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecione o arquivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Download size={16} /> Baixar Template
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportResult(null)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                  disabled={importing}
                >
                  Fechar
                </button>
              </div>
            </form>

            {importing && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
                <p className="text-blue-700 dark:text-blue-300">Processando importação...</p>
              </div>
            )}

            {importResult && (
              <div
                className={`border rounded-lg p-4 ${
                  importResult.errorCount === 0
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
                    : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
                }`}
              >
                <p className="font-semibold mb-2">Resultado da Importação:</p>
                <p className="text-gray-700 dark:text-gray-300">Total processado: {importResult.totalProcessed}</p>
                <p className="text-green-600 dark:text-green-400">Sucesso: {importResult.successCount}</p>
                {importResult.errorCount > 0 && (
                  <>
                    <p className="text-red-600 dark:text-red-400">Erros: {importResult.errorCount}</p>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <ul className="list-disc list-inside text-sm">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md space-y-4 border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Exportar Lançamentos</h2>
              <button
                onClick={() => {
                  setShowExportModal(false)
                  setExportAll(true)
                  setExportStartDate('')
                  setExportEndDate('')
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="exportAll"
                  checked={exportAll}
                  onChange={() => setExportAll(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="exportAll" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Exportar todos os lançamentos
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="exportPeriod"
                  checked={!exportAll}
                  onChange={() => setExportAll(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="exportPeriod" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Exportar por período
                </label>
              </div>

              {!exportAll && (
                <div className="grid grid-cols-2 gap-4 ml-7">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data Inicial
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data Final
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    setExportAll(true)
                    setExportStartDate('')
                    setExportEndDate('')
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await actions.exportTransactions(
                        exportAll ? undefined : exportStartDate || undefined,
                        exportAll ? undefined : exportEndDate || undefined
                      )
                      setShowExportModal(false)
                      setExportAll(true)
                      setExportStartDate('')
                      setExportEndDate('')
                    } catch (error) {
                      console.error('Erro ao exportar:', error)
                      alert('Erro ao exportar lançamentos. Verifique o console para mais detalhes.')
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <FileDown size={16} /> Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInstallmentsModal && editingInstallmentsParentId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowInstallmentsModal(false)
              setEditingInstallmentsParentId(null)
            }
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Package size={20} />
              Editar Compra Parcelada
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Valor Total Original (R$)
                  <input
                    type="number"
                    step="0.01"
                    value={editInstallmentsTotalValue}
                    onChange={(e) => setEditInstallmentsTotalValue(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data da Compra
                  <input
                    type="date"
                    value={editInstallmentsPurchaseDate}
                    onChange={(e) => setEditInstallmentsPurchaseDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                  Quantidade de parcelas
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editInstallmentsCount}
                    onChange={(e) => setEditInstallmentsCount(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Se for diferente da quantidade atual, as parcelas serão recriadas com o mesmo vínculo, mantendo o valor total (última parcela ajusta centavos).
                  </p>
                </label>
              </div>

              {installmentsModalResizePreview && (
                <div className="text-sm border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50/80 dark:bg-blue-950/30">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Preview após salvar</p>
                  <p className="text-blue-800 dark:text-blue-200">
                    {installmentsModalResizePreview.installments}x de R${' '}
                    {installmentsModalResizePreview.installmentValue.toFixed(2)} — 1ª competência:{' '}
                    {installmentsModalResizePreview.firstCompetency}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Parcelas ({sortedInstallmentsModal.length}x)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sortedInstallmentsModal.map((installment) => {
                      const newValue = editInstallmentsTotalValue 
                        ? (Number(editInstallmentsTotalValue) / sortedInstallmentsModal.length).toFixed(2)
                        : installment.value.toFixed(2)
                      const purchaseDate = editInstallmentsPurchaseDate ? new Date(editInstallmentsPurchaseDate) : new Date(installment.date)
                      const installmentDate = new Date(purchaseDate)
                      installmentDate.setMonth(purchaseDate.getMonth() + (installment.installmentNumber - 1))
                      const competencyDate = new Date(installmentDate)
                      const newCompetency = `${String(competencyDate.getMonth() + 1).padStart(2, '0')}/${competencyDate.getFullYear()}`
                      
                      return (
                        <div
                          key={installment.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {installment.installmentNumber}/{sortedInstallmentsModal.length}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {installmentDate.toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-gray-500 dark:text-gray-500 text-xs">
                              {newCompetency}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            R$ {newValue}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>

              {canAnticipateCredit && (
                <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50/80 dark:bg-amber-950/30 space-y-3">
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Antecipar parcelas</h3>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Funde um intervalo contíguo em uma única parcela na posição &quot;De&quot;, soma os valores e renumeria o restante.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      De (parcela)
                      <select
                        value={anticipateFrom}
                        onChange={(e) => {
                          const v = e.target.value
                          setAnticipateFrom(v)
                          const toN = parseInt(anticipateTo, 10)
                          if (!Number.isNaN(toN) && toN <= parseInt(v, 10)) {
                            setAnticipateTo(String(Math.min(parseInt(v, 10) + 1, sortedInstallmentsModal.length)))
                          }
                        }}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      >
                        {sortedInstallmentsModal.slice(0, -1).map((t) => (
                          <option key={t.id} value={String(t.installmentNumber)}>
                            {t.installmentNumber}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Até (parcela)
                      <select
                        value={anticipateTo}
                        onChange={(e) => setAnticipateTo(e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      >
                        {sortedInstallmentsModal
                          .filter((t) => t.installmentNumber > parseInt(anticipateFrom, 10))
                          .map((t) => (
                            <option key={t.id} value={String(t.installmentNumber)}>
                              {t.installmentNumber}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  {anticipateMergedPreview != null && (
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      Valor fundido: <strong>R$ {anticipateMergedPreview.toFixed(2)}</strong>
                    </p>
                  )}
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anticipateUseTargetCompetency}
                      onChange={(e) => setAnticipateUseTargetCompetency(e.target.checked)}
                      className="rounded border-gray-300 dark:border-slate-600"
                    />
                    Definir competência da parcela fundida (opcional)
                  </label>
                  {anticipateUseTargetCompetency && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Competência (MM/aaaa)</p>
                      <MonthYearSelector
                        value={anticipateTargetCompetency}
                        onChange={setAnticipateTargetCompetency}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editingInstallmentsParentId) return
                      const fromN = parseInt(anticipateFrom, 10)
                      const toN = parseInt(anticipateTo, 10)
                      if (fromN >= toN) return
                      if (
                        !confirm(
                          `Antecipar parcelas ${fromN} a ${toN}? As parcelas intermediárias serão removidas e os valores fundidos na parcela ${fromN}.`,
                        )
                      ) {
                        return
                      }
                      try {
                        setAnticipateSubmitting(true)
                        await actions.anticipateInstallments(editingInstallmentsParentId, {
                          fromInstallmentNumber: fromN,
                          toInstallmentNumber: toN,
                          ...(anticipateUseTargetCompetency && anticipateTargetCompetency.trim()
                            ? { targetCompetency: anticipateTargetCompetency.trim() }
                            : {}),
                        })
                        const updated = await actions.getInstallments(editingInstallmentsParentId)
                        setInstallmentsList(updated)
                        setEditInstallmentsTotalValue(updated.reduce((s, t) => s + t.value, 0).toFixed(2))
                        const sorted = [...updated].sort((a, b) => a.installmentNumber - b.installmentNumber)
                        const n = sorted.length
                        setAnticipateFrom('1')
                        setAnticipateTo(n >= 2 ? '2' : '1')
                      } catch (err) {
                        console.error(err)
                        const raw = err instanceof Error ? err.message : ''
                        try {
                          const j = JSON.parse(raw) as { message?: string }
                          alert((j.message ?? raw) || 'Falha ao antecipar parcelas.')
                        } catch {
                          alert(raw || 'Falha ao antecipar parcelas.')
                        }
                      } finally {
                        setAnticipateSubmitting(false)
                      }
                    }}
                    disabled={isMonthClosed || anticipateSubmitting || parseInt(anticipateFrom, 10) >= parseInt(anticipateTo, 10)}
                    className="w-full px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white rounded-lg font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {anticipateSubmitting ? 'Aplicando…' : 'Aplicar antecipação'}
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={async () => {
                    if (confirm('Tem certeza que deseja deletar todas as parcelas desta compra?')) {
                      await actions.deleteAllInstallments(editingInstallmentsParentId)
                      setShowInstallmentsModal(false)
                      setEditingInstallmentsParentId(null)
                    }
                  }}
                  disabled={isMonthClosed}
                  className="flex-1 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg font-semibold hover:bg-red-600 dark:hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Deletar Todas as Parcelas
                </button>
                <button
                  onClick={() => {
                    setShowInstallmentsModal(false)
                    setEditingInstallmentsParentId(null)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const n = parseInt(editInstallmentsCount, 10)
                    const payload: {
                      newTotalValue?: number
                      newPurchaseDate?: string
                      newTotalInstallments?: number
                    } = {
                      newTotalValue: editInstallmentsTotalValue ? Number(editInstallmentsTotalValue) : undefined,
                      newPurchaseDate: editInstallmentsPurchaseDate || undefined,
                    }
                    if (!Number.isNaN(n) && n >= 1 && n !== sortedInstallmentsModal.length) {
                      payload.newTotalInstallments = n
                    }
                    await actions.updateInstallments(editingInstallmentsParentId, payload)
                    setShowInstallmentsModal(false)
                    setEditingInstallmentsParentId(null)
                  }}
                  disabled={isMonthClosed}
                  className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteChoiceTransaction?.parentPurchase && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteChoiceTransaction(null)
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-slate-700 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Excluir parcela</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Esta compra tem <strong>{deleteChoiceTransaction.totalInstallments}</strong> parcelas vinculadas. O que deseja excluir?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  const id = deleteChoiceTransaction.id
                  setDeleteChoiceTransaction(null)
                  await actions.deleteTransaction(id)
                }}
                className="w-full px-4 py-2 rounded-lg border border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100 hover:bg-orange-50 dark:hover:bg-orange-950/40 font-medium"
              >
                Apenas esta parcela ({deleteChoiceTransaction.installmentNumber}/{deleteChoiceTransaction.totalInstallments})
              </button>
              <button
                type="button"
                onClick={async () => {
                  const pid = deleteChoiceTransaction.parentPurchase
                  setDeleteChoiceTransaction(null)
                  if (pid != null) await actions.deleteAllInstallments(pid)
                }}
                className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:opacity-90"
              >
                Todas as {deleteChoiceTransaction.totalInstallments} parcelas desta compra
              </button>
              <button
                type="button"
                onClick={() => setDeleteChoiceTransaction(null)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

