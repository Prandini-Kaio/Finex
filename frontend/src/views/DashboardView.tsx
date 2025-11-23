import { useMemo, useState } from 'react'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
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
import type { Transaction } from '../types/finance'
import { getSavingsProgress } from '../utils/finance'
import { MonthYearSelector } from '../components/MonthYearSelector'

interface DashboardViewProps {
  selectedMonth: string
  onMonthChange: (value: string) => void
  transactions: Transaction[]
}

const PERSON_COLORS: Record<string, string> = {
  Kaio: '#3b82f6',
  Gabriela: '#ec4899',
  Ambos: '#a855f7',
}

// Cores para categorias
const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: '#ef4444',
  Lazer: '#8b5cf6',
  Moradia: '#3b82f6',
  Transporte: '#f59e0b',
  Saúde: '#10b981',
  Educação: '#ec4899',
  Outros: '#6b7280',
}

// Função para obter cor de categoria (com fallback para cores aleatórias)
const getCategoryColor = (category: string, index: number): string => {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category]
  }
  // Cores alternativas para categorias não mapeadas
  const fallbackColors = ['#f97316', '#06b6d4', '#84cc16', '#a855f7', '#ec4899', '#3b82f6']
  return fallbackColors[index % fallbackColors.length]
}

interface SimulatorForm {
  value: string
  installments: string
  interestRate: string
}

const defaultSimulator: SimulatorForm = {
  value: '',
  installments: '1',
  interestRate: '0',
}

export const DashboardView: React.FC<DashboardViewProps> = ({ selectedMonth, onMonthChange, transactions }) => {
  const {
    state: { savingsGoals, transactions: allTransactions },
  } = useFinance()

  const [showSimulator, setShowSimulator] = useState(false)
  const [simulatorForm, setSimulatorForm] = useState<SimulatorForm>(defaultSimulator)
  const [simulationResult, setSimulationResult] = useState<{
    installmentValue: number
    totalWithInterest: number
    totalInterest: number
    installmentsTable?: Array<{ installment: number; month: string; value: number }>
  } | null>(null)

  const stats = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'Despesa').reduce((sum, t) => sum + t.value, 0)
    const income = transactions.filter((t) => t.type === 'Receita').reduce((sum, t) => sum + t.value, 0)

    const byCategory = transactions
      .filter((t) => t.type === 'Despesa')
      .reduce<Record<string, number>>((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.value
        return acc
      }, {})

    const byPerson = transactions
      .filter((t) => t.type === 'Despesa')
      .reduce<Record<string, number>>((acc, transaction) => {
        acc[transaction.person] = (acc[transaction.person] ?? 0) + transaction.value
        return acc
      }, {})

    return {
      expenses,
      income,
      balance: income - expenses,
      byCategory,
      byPerson,
    }
  }, [transactions])

  const categoryChart = useMemo(
    () =>
      Object.entries(stats.byCategory).map(([name, value], index) => ({
        name,
        value,
        fill: getCategoryColor(name, index),
      })),
    [stats.byCategory],
  )

  const personChart = useMemo(
    () => Object.entries(stats.byPerson).map(([name, value]) => ({ name, value, fill: PERSON_COLORS[name] })),
    [stats.byPerson],
  )

  const savingsInfo = useMemo(() => getSavingsProgress(savingsGoals), [savingsGoals])

  // Gráfico de gastos anuais
  const annualSpendingChart = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    // Filtrar transações do ano atual
    const yearTransactions = allTransactions.filter((t) => {
      const [, year] = t.competency.split('/')
      return parseInt(year) === currentYear
    })

    // Agrupar por mês
    const monthlyData = months.map((monthName, index) => {
      const monthNum = String(index + 1).padStart(2, '0')
      const monthKey = `${monthNum}/${currentYear}`
      
      const monthExpenses = yearTransactions
        .filter((t) => t.competency === monthKey && t.type === 'Despesa')
        .reduce((sum, t) => sum + t.value, 0)

      const monthIncome = yearTransactions
        .filter((t) => t.competency === monthKey && t.type === 'Receita')
        .reduce((sum, t) => sum + t.value, 0)

      return {
        month: monthName,
        despesas: monthExpenses,
        receitas: monthIncome,
        saldo: monthIncome - monthExpenses,
      }
    })

    return monthlyData
  }, [allTransactions])

  // Gráfico de economia/poupança anual
  const annualSavingsChart = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    // Filtrar transações do ano atual
    const yearTransactions = allTransactions.filter((t) => {
      const [, year] = t.competency.split('/')
      return parseInt(year) === currentYear
    })

    // Calcular economia acumulada mês a mês
    let accumulatedSavings = 0
    const monthlySavings = months.map((monthName, index) => {
      const monthNum = String(index + 1).padStart(2, '0')
      const monthKey = `${monthNum}/${currentYear}`
      
      const monthExpenses = yearTransactions
        .filter((t) => t.competency === monthKey && t.type === 'Despesa')
        .reduce((sum, t) => sum + t.value, 0)

      const monthIncome = yearTransactions
        .filter((t) => t.competency === monthKey && t.type === 'Receita')
        .reduce((sum, t) => sum + t.value, 0)

      const monthSavings = monthIncome - monthExpenses
      accumulatedSavings += monthSavings

      return {
        month: monthName,
        economia: accumulatedSavings,
        poupanca: savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0),
      }
    })

    return monthlySavings
  }, [allTransactions, savingsGoals])

  // Visualizador rápido de Kaio e Gabriela
  const personStats = useMemo(() => {
    // Kaio
    const kaioExpenses = transactions
      .filter((t) => t.type === 'Despesa' && (t.person === 'Kaio' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    const kaioIncome = transactions
      .filter((t) => t.type === 'Receita' && (t.person === 'Kaio' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    const kaioBalance = kaioIncome - kaioExpenses

    // Gabriela
    const gabrielaExpenses = transactions
      .filter((t) => t.type === 'Despesa' && (t.person === 'Gabriela' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    const gabrielaIncome = transactions
      .filter((t) => t.type === 'Receita' && (t.person === 'Gabriela' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    const gabrielaBalance = gabrielaIncome - gabrielaExpenses

    return {
      kaio: {
        income: kaioIncome,
        expenses: kaioExpenses,
        balance: kaioBalance,
      },
      gabriela: {
        income: gabrielaIncome,
        expenses: gabrielaExpenses,
        balance: gabrielaBalance,
      },
    }
  }, [transactions])

  const handleSimulator = () => {
    if (!simulatorForm.value) return
    const value = Number(simulatorForm.value)
    const installments = Number(simulatorForm.installments)
    const interestRate = Number(simulatorForm.interestRate) / 100
    let installmentValue = value / installments
    let totalWithInterest = value

    if (interestRate > 0 && installments > 1) {
      installmentValue =
        (value * interestRate * Math.pow(1 + interestRate, installments)) / (Math.pow(1 + interestRate, installments) - 1)
      totalWithInterest = installmentValue * installments
    }

    // Gerar tabela de parcelas
    const [currentMonth, currentYear] = selectedMonth.split('/')
    const installmentsTable = Array.from({ length: installments }, (_, i) => {
      const month = parseInt(currentMonth) + i
      const year = parseInt(currentYear)
      let finalMonth = month
      let finalYear = year
      
      if (month > 12) {
        finalMonth = month - 12
        finalYear = year + 1
      }
      
      return {
        installment: i + 1,
        month: `${String(finalMonth).padStart(2, '0')}/${finalYear}`,
        value: installmentValue,
      }
    })

    setSimulationResult({
      installmentValue,
      totalWithInterest,
      totalInterest: totalWithInterest - value,
      installmentsTable,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <MonthYearSelector value={selectedMonth} onChange={onMonthChange} />
          <button
            onClick={() => setShowSimulator(true)}
            className="px-4 py-2 rounded-lg bg-secondary text-white hover:opacity-90 transition-opacity"
          >
            🧮 Simulador
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Receitas"
          value={`R$ ${stats.income.toFixed(2)}`}
          icon={<TrendingUp className="text-green-500" size={32} />}
          accent="border-green-500"
        />
        <SummaryCard
          title="Despesas"
          value={`R$ ${stats.expenses.toFixed(2)}`}
          icon={<TrendingDown className="text-red-500" size={32} />}
          accent="border-red-500"
        />
        <SummaryCard
          title="Saldo do mês"
          value={`R$ ${stats.balance.toFixed(2)}`}
          icon={<DollarSign className="text-blue-500" size={32} />}
          accent={stats.balance >= 0 ? 'border-blue-500' : 'border-orange-500'}
        />
        <SummaryCard
          title="Poupado vs Meta"
          value={`${savingsInfo.percentage.toFixed(1)}%`}
          icon={<span className="text-purple-500 text-3xl">🏦</span>}
          accent="border-purple-500"
          helper={`R$ ${savingsInfo.totalSaved.toFixed(2)} / R$ ${savingsInfo.totalGoals.toFixed(2)}`}
        />
      </div>

      {/* Visualizador Rápido de Kaio e Gabriela */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kaio */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-lg p-6 border-2 border-blue-300 dark:border-blue-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">💰 Kaio</h2>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-800 px-3 py-1 rounded-full">
              {selectedMonth}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow border-l-4 border-green-500 border border-gray-200 dark:border-slate-700">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Entradas</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">R$ {personStats.kaio.income.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow border-l-4 border-red-500 border border-gray-200 dark:border-slate-700">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Saídas</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">R$ {personStats.kaio.expenses.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow border-l-4 border-blue-500 border border-gray-200 dark:border-slate-700">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Saldo</p>
              <p
                className={`text-xl font-bold ${
                  personStats.kaio.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                R$ {personStats.kaio.balance.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-300">
                Economia:{' '}
                <strong className="text-blue-700 dark:text-blue-300">
                  {personStats.kaio.income > 0
                    ? ((personStats.kaio.balance / personStats.kaio.income) * 100).toFixed(1)
                    : 0}
                  %
                </strong>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                Gasto:{' '}
                <strong className="text-red-700 dark:text-red-300">
                  {personStats.kaio.income > 0
                    ? ((personStats.kaio.expenses / personStats.kaio.income) * 100).toFixed(1)
                    : 0}
                  %
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Gabriela */}
        <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg shadow-lg p-6 border-2 border-pink-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">💰 Gabriela</h2>
            <span className="text-sm font-semibold text-pink-700 bg-pink-200 px-3 py-1 rounded-full">
              {selectedMonth}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 shadow border-l-4 border-green-500">
              <p className="text-xs text-gray-600 mb-1">Entradas</p>
              <p className="text-xl font-bold text-green-600">R$ {personStats.gabriela.income.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow border-l-4 border-red-500">
              <p className="text-xs text-gray-600 mb-1">Saídas</p>
              <p className="text-xl font-bold text-red-600">R$ {personStats.gabriela.expenses.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow border-l-4 border-pink-500">
              <p className="text-xs text-gray-600 mb-1">Saldo</p>
              <p
                className={`text-xl font-bold ${
                  personStats.gabriela.balance >= 0 ? 'text-pink-600' : 'text-orange-600'
                }`}
              >
                R$ {personStats.gabriela.balance.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-pink-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                Economia:{' '}
                <strong className="text-pink-700">
                  {personStats.gabriela.income > 0
                    ? ((personStats.gabriela.balance / personStats.gabriela.income) * 100).toFixed(1)
                    : 0}
                  %
                </strong>
              </span>
              <span className="text-gray-600">
                Gasto:{' '}
                <strong className="text-red-700">
                  {personStats.gabriela.income > 0
                    ? ((personStats.gabriela.expenses / personStats.gabriela.income) * 100).toFixed(1)
                    : 0}
                  %
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Despesas por Categoria</h3>
          {categoryChart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {categoryChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Nenhuma despesa para este mês" />
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Despesas por Pessoa</h3>
          {personChart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={personChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {personChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Nenhuma despesa para este mês" />
          )}
        </div>
      </div>

      {/* Gráficos Anuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de Gastos Anuais */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Gastos Anuais - {new Date().getFullYear()}</h3>
          {annualSpendingChart.some((d) => d.despesas > 0 || d.receitas > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={annualSpendingChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Nenhum dado disponível para este ano" />
          )}
        </div>

        {/* Gráfico de Economia/Poupança Anual */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Economia e Poupança - {new Date().getFullYear()}</h3>
          {annualSavingsChart.some((d) => d.economia !== 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={annualSavingsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="economia"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Economia Acumulada"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="poupanca"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Poupança Total"
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Nenhum dado disponível para este ano" />
          )}
        </div>
      </div>

      {/* Gráficos Anuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de Gastos Anuais */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Gastos Anuais - {new Date().getFullYear()}</h3>
          {annualSpendingChart.some((d) => d.despesas > 0 || d.receitas > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={annualSpendingChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Nenhum dado disponível para este ano" />
          )}
        </div>

        {/* Gráfico de Economia/Poupança Anual */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Economia e Poupança - {new Date().getFullYear()}</h3>
          {annualSavingsChart.some((d) => d.economia !== 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={annualSavingsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="economia"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Economia Acumulada"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="poupanca"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Poupança Total"
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Nenhum dado disponível para este ano" />
          )}
        </div>
      </div>

      {showSimulator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4 border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Simulador de Parcelas</h2>
              <button
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                onClick={() => {
                  setShowSimulator(false)
                  setSimulationResult(null)
                  setSimulatorForm(defaultSimulator)
                }}
              >
                ✕
              </button>
            </div>

            {/* Resumo do Mês Atual */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Resumo do Mês - {selectedMonth}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-300">Receitas</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">R$ {stats.income.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300">Despesas</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">R$ {stats.expenses.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300">Saldo Atual</p>
                  <p className={`text-lg font-bold ${stats.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    R$ {stats.balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  value={simulatorForm.value}
                  onChange={(event) => setSimulatorForm({ ...simulatorForm, value: event.target.value })}
                  placeholder="0.00"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Parcelas
                <select
                  value={simulatorForm.installments}
                  onChange={(event) => setSimulatorForm({ ...simulatorForm, installments: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  {[1, 2, 3, 6, 9, 12, 18, 24].map((value) => (
                    <option key={value} value={value}>
                      {value}x
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Juros mensais (%)
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  value={simulatorForm.interestRate}
                  onChange={(event) => setSimulatorForm({ ...simulatorForm, interestRate: event.target.value })}
                  placeholder="0.00"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                onClick={() => {
                  setSimulationResult(null)
                  setSimulatorForm(defaultSimulator)
                }}
              >
                Limpar
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                onClick={handleSimulator}
              >
                Calcular
              </button>
            </div>

            {/* Resultado da Simulação */}
            {simulationResult && (
              <div className="space-y-4">
                {/* Resumo Financeiro */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Resumo da Simulação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Valor da Parcela</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-400">R$ {simulationResult.installmentValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Total com Juros</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-400">R$ {simulationResult.totalWithInterest.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Juros Totais</p>
                      <p className="text-xl font-bold text-red-700 dark:text-red-400">R$ {simulationResult.totalInterest.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Tabela de Parcelas */}
                {simulationResult.installmentsTable && simulationResult.installmentsTable.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 p-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">Cronograma de Parcelas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Parcela</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Mês/Ano</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Valor</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Projetado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                          {simulationResult.installmentsTable.map((item, index) => {
                            const projectedBalance = stats.balance - simulationResult.installmentValue * (index + 1)
                            return (
                              <tr key={item.installment} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.installment}ª</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.month}</td>
                                <td className="px-4 py-2 text-sm font-medium text-right text-red-600 dark:text-red-400">
                                  R$ {item.value.toFixed(2)}
                                </td>
                                <td className={`px-4 py-2 text-sm font-medium text-right ${projectedBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                  R$ {projectedBalance.toFixed(2)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const SummaryCard: React.FC<{
  title: string
  value: string
  icon: React.ReactNode
  accent: string
  helper?: string
}> = ({ title, value, icon, accent, helper }) => (
  <div className={`bg-white dark:bg-slate-800 border-l-4 ${accent} rounded-lg p-4 shadow border border-gray-200 dark:border-slate-700`}>
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        {helper && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{helper}</p>}
      </div>
      {icon}
    </div>
  </div>
)

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">{message}</div>
)

