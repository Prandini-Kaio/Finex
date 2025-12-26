import { useMemo, useState, useEffect } from 'react'
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
import type { FinanceFilters, PaymentMethod, Transaction, TransactionPayload } from '../types/finance'
import { buildInstallments, getPersonIdByName, getInstallmentPreview } from '../utils/finance'
import { MonthYearSelector } from '../components/MonthYearSelector'

type FormState = {
  date: string
  type: Transaction['type']
  paymentMethod: PaymentMethod
  person: string
  category: string
  description: string
  value: string
  competency: string
  creditCard: string
  installments: string
}

const defaultForm = (selectedMonth: string): FormState => ({
  date: new Date().toISOString().split('T')[0],
  type: 'Despesa',
  paymentMethod: 'Crédito',
  person: 'Kaio',
  category: 'Alimentação',
  description: '',
  value: '',
  competency: selectedMonth,
  creditCard: '',
  installments: '1',
})

interface TransactionsViewProps {
  filters: FinanceFilters
  onFiltersChange: (next: FinanceFilters) => void
  selectedMonth: string
  onMonthChange: (month: string) => void
  transactions: Transaction[]
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  filters,
  onFiltersChange,
  selectedMonth,
  onMonthChange,
  transactions,
}) => {
  const {
    state: { categories, creditCards, closedMonths, persons },
    actions,
  } = useFinance()

  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm(selectedMonth))
  const [submitting, setSubmitting] = useState(false)
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

  const isMonthClosed = closedMonths.includes(selectedMonth)

  const installmentPreview = useMemo(() => {
    if (
      form.paymentMethod === 'Crédito' &&
      form.creditCard &&
      form.date &&
      form.value &&
      form.installments
    ) {
      return getInstallmentPreview(form.date, Number(form.value), Number(form.installments))
    }
    return null
  }, [form.paymentMethod, form.creditCard, form.date, form.value, form.installments])

  // Resetar form quando o modal abrir
  useEffect(() => {
    if (showModal && !editingTransactionId) {
      setForm(defaultForm(selectedMonth))
    }
  }, [showModal, selectedMonth, editingTransactionId])

  // Handler para abrir o modal
  const handleOpenModal = () => {
    if (!isMonthClosed) {
      setShowModal(true)
    }
  }

  const handleFilterChange = (key: keyof FinanceFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const handleSubmit = async () => {
    if (!form.value || !form.description) return
    if (form.paymentMethod === 'Crédito' && !form.creditCard) return

    const personId = getPersonIdByName(persons, form.person)
    if (!personId) return

    setSubmitting(true)
    try {
      if (editingTransactionId) {
        const payload: TransactionPayload = {
          date: form.date,
          type: form.type,
          paymentMethod: form.paymentMethod,
          personId,
          category: form.category,
          description: form.description,
          value: Number(form.value),
          competency: form.competency,
          creditCard: form.creditCard,
          creditCardId: form.creditCard ? Number(form.creditCard) : undefined,
          installments: Number(form.installments),
          installmentNumber: 1,
          totalInstallments: Number(form.installments),
          parentPurchase: undefined,
        }
        await actions.updateTransaction(editingTransactionId, payload)
      } else {
        const payloads: TransactionPayload[] = buildInstallments({
          date: form.date,
          type: form.type,
          paymentMethod: form.paymentMethod,
          person: form.person,
          personId,
          category: form.category,
          description: form.description,
          value: Number(form.value),
          competency: form.competency,
          creditCard: form.creditCard,
          installments: Number(form.installments),
        })
        await actions.addTransactions(payloads)
      }
      setShowModal(false)
      setEditingTransactionId(null)
      setForm(defaultForm(selectedMonth))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    if (isMonthClosed) return
    
    setEditingTransactionId(transaction.id)
    setForm({
      date: transaction.date,
      type: transaction.type,
      paymentMethod: transaction.paymentMethod,
      person: transaction.person,
      category: transaction.category,
      description: transaction.description,
      value: transaction.value.toString(),
      competency: transaction.competency,
      creditCard: transaction.creditCardId ? String(transaction.creditCardId) : transaction.creditCard || '',
      installments: transaction.totalInstallments > 1 ? transaction.totalInstallments.toString() : '1',
    })
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.person}
            onChange={(event) => handleFilterChange('person', event.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="Todos">Todos</option>
            <option value="Kaio">Kaio</option>
            <option value="Gabriela">Gabriela</option>
            <option value="Ambos">Ambos</option>
          </select>
          <select
            value={filters.category}
            onChange={(event) => handleFilterChange('category', event.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="Todas">Todas</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select
            value={filters.paymentType}
            onChange={(event) => handleFilterChange('paymentType', event.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="Todos">Todos</option>
            <option value="Crédito">Crédito</option>
            <option value="Débito">Débito</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="PIX">PIX</option>
          </select>
          <select
            value={filters.creditCard}
            onChange={(event) => handleFilterChange('creditCard', event.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="Todos">Todos os cartões</option>
            <option value="Sem cartão">Sem cartão</option>
            {creditCards.map((card) => (
              <option key={card.id} value={String(card.id)}>
                {card.name} - {card.owner}
              </option>
            ))}
          </select>
          <MonthYearSelector value={selectedMonth} onChange={onMonthChange} />
        </div>

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
                        disabled={isMonthClosed}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Editar lançamento"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => actions.deleteTransaction(transaction.id)}
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

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
            }
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {editingTransactionId ? 'Editar lançamento' : 'Novo lançamento'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Competência
                <div className="mt-1">
                  <MonthYearSelector
                    value={form.competency}
                    onChange={(value) => setForm({ ...form, competency: value })}
                  />
                </div>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value as Transaction['type'] })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Despesa">Despesa</option>
                  <option value="Receita">Receita</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pessoa
                <select
                  value={form.person}
                  onChange={(event) => setForm({ ...form, person: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  {persons.filter(p => p.active).map((person) => (
                    <option key={person.id} value={person.name}>{person.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Categoria
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Descrição
                <input
                  type="text"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor (R$)
                <input
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(event) => setForm({ ...form, value: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pagamento
                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm({ ...form, paymentMethod: event.target.value as PaymentMethod })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Crédito">Crédito</option>
                  <option value="Débito">Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                </select>
              </label>
              {form.paymentMethod === 'Crédito' && (
                <>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cartão de crédito
                    <select
                      value={form.creditCard}
                      onChange={(event) => setForm({ ...form, creditCard: event.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Selecione</option>
                      {creditCards.map((card) => (
                        <option key={card.id} value={String(card.id)}>
                          {card.name} - {card.owner}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Parcelas
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.installments}
                      onChange={(event) => setForm({ ...form, installments: event.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      placeholder="1"
                    />
                  </label>
                  {installmentPreview && (
                    <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">📅</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                            Preview das Parcelas
                            <span className="text-xs font-normal bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded-full">
                              {creditCards.find(c => String(c.id) === form.creditCard)?.name || 'Cartão selecionado'}
                            </span>
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-md p-2 border border-blue-200 dark:border-blue-700">
                              <p className="text-blue-800 dark:text-blue-200">
                                <span className="font-semibold">1ª parcela cairá em:</span>{' '}
                                <span className="text-blue-900 dark:text-blue-100 font-bold text-base">
                                  {installmentPreview.firstCompetency}
                                </span>
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Valor: R$ {installmentPreview.installmentValue.toFixed(2)}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white dark:bg-slate-800 rounded-md p-2 border border-blue-200 dark:border-blue-700">
                                <p className="text-blue-600 dark:text-blue-400">Parcelas</p>
                                <p className="text-blue-900 dark:text-blue-100 font-bold">
                                  {installmentPreview.installments}x
                                </p>
                              </div>
                              <div className="bg-white dark:bg-slate-800 rounded-md p-2 border border-blue-200 dark:border-blue-700">
                                <p className="text-blue-600 dark:text-blue-400">Total</p>
                                <p className="text-blue-900 dark:text-blue-100 font-bold">
                                  R$ {installmentPreview.totalValue.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            {installmentPreview.installments > 1 && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 py-1">
                                  📋 Ver cronograma completo ({installmentPreview.installments} parcelas)
                                </summary>
                                <div className="mt-2 bg-white dark:bg-slate-800 rounded-md p-2 border border-blue-200 dark:border-blue-700 max-h-40 overflow-y-auto">
                                  {installmentPreview.allCompetencies.map((comp, idx) => (
                                    <div key={idx} className="py-1.5 border-b border-blue-100 dark:border-blue-800 last:border-0 flex justify-between items-center text-xs">
                                      <span className="text-blue-800 dark:text-blue-200">
                                        <span className="font-semibold">{idx + 1}ª parcela:</span> {comp}
                                      </span>
                                      <span className="text-blue-900 dark:text-blue-100 font-bold">
                                        R$ {installmentPreview.installmentValue.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingTransactionId(null)
                  setForm(defaultForm(selectedMonth))
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                disabled={submitting}
              >
                {editingTransactionId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              </div>

              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Parcelas ({installmentsList.length}x)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {installmentsList
                    .sort((a, b) => a.installmentNumber - b.installmentNumber)
                    .map((installment) => {
                      const newValue = editInstallmentsTotalValue 
                        ? (Number(editInstallmentsTotalValue) / installmentsList.length).toFixed(2)
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
                              {installment.installmentNumber}/{installmentsList.length}
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
                    await actions.updateInstallments(editingInstallmentsParentId, {
                      newTotalValue: editInstallmentsTotalValue ? Number(editInstallmentsTotalValue) : undefined,
                      newPurchaseDate: editInstallmentsPurchaseDate || undefined,
                    })
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
    </div>
  )
}

