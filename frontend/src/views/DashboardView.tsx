import { useMemo, useState } from 'react'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import type { Transaction } from '../types/finance'
import { getSavingsProgress } from '../utils/finance'

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
    state: { savingsGoals },
  } = useFinance()

  const [showSimulator, setShowSimulator] = useState(false)
  const [simulatorForm, setSimulatorForm] = useState<SimulatorForm>(defaultSimulator)
  const [simulationResult, setSimulationResult] = useState<{
    installmentValue: number
    totalWithInterest: number
    totalInterest: number
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
    () => Object.entries(stats.byCategory).map(([name, value]) => ({ name, value })),
    [stats.byCategory],
  )

  const personChart = useMemo(
    () => Object.entries(stats.byPerson).map(([name, value]) => ({ name, value, fill: PERSON_COLORS[name] })),
    [stats.byPerson],
  )

  const savingsInfo = useMemo(() => getSavingsProgress(savingsGoals), [savingsGoals])

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

    setSimulationResult({
      installmentValue,
      totalWithInterest,
      totalInterest: totalWithInterest - value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="MM/AAAA"
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <button
            onClick={() => setShowSimulator(true)}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
          {categoryChart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Nenhuma despesa para este mês" />
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Despesas por Pessoa</h3>
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

      {showSimulator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Simulador de Parcelas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700">
                Valor
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  value={simulatorForm.value}
                  onChange={(event) => setSimulatorForm({ ...simulatorForm, value: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Parcelas
                <select
                  value={simulatorForm.installments}
                  onChange={(event) => setSimulatorForm({ ...simulatorForm, installments: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                >
                  {[1, 2, 3, 6, 9, 12, 18, 24].map((value) => (
                    <option key={value} value={value}>
                      {value}x
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                Juros mensais (%)
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  value={simulatorForm.interestRate}
                  onChange={(event) => setSimulatorForm({ ...simulatorForm, interestRate: event.target.value })}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 border rounded-lg" onClick={() => setShowSimulator(false)}>
                Fechar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={handleSimulator}>
                Calcular
              </button>
            </div>
            {simulationResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p>
                  Parcela: <strong>R$ {simulationResult.installmentValue.toFixed(2)}</strong>
                </p>
                <p>
                  Total com juros: <strong>R$ {simulationResult.totalWithInterest.toFixed(2)}</strong>
                </p>
                <p>
                  Juros totais: <strong>R$ {simulationResult.totalInterest.toFixed(2)}</strong>
                </p>
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
  <div className={`bg-white border-l-4 ${accent} rounded-lg p-4 shadow`}>
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
      </div>
      {icon}
    </div>
  </div>
)

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">{message}</div>
)

