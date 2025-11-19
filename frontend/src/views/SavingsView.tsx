import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
import type { Person, SavingsGoalPayload } from '../types/finance'

const goalFormDefaults = (): Omit<SavingsGoalPayload, 'targetAmount'> & { targetAmount: string } => ({
  name: '',
  owner: 'Kaio',
  deadline: '',
  description: '',
  targetAmount: '',
})

export const SavingsView: React.FC = () => {
  const {
    state: { savingsGoals },
    actions,
  } = useFinance()

  const [goalForm, setGoalForm] = useState(goalFormDefaults())
  const [depositGoalId, setDepositGoalId] = useState<number | null>(null)
  const [depositValue, setDepositValue] = useState('')
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0])

  const totalSaved = useMemo(() => savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0), [savingsGoals])
  const totalTarget = useMemo(() => savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0), [savingsGoals])

  // Gráfico de distribuição por objetivo (Pie Chart)
  const distributionChart = useMemo(() => {
    if (totalSaved === 0) return []
    return savingsGoals
      .filter((goal) => goal.currentAmount > 0)
      .map((goal) => ({
        name: goal.name,
        value: goal.currentAmount,
        percentage: ((goal.currentAmount / totalSaved) * 100).toFixed(1),
      }))
  }, [savingsGoals, totalSaved])

  // Gráfico de progresso por objetivo (Bar Chart)
  const progressChart = useMemo(() => {
    return savingsGoals.map((goal) => {
      const percentage = (goal.currentAmount / goal.targetAmount) * 100
      return {
        name: goal.name.length > 15 ? goal.name.substring(0, 15) + '...' : goal.name,
        progress: Math.min(percentage, 100),
        current: goal.currentAmount,
        target: goal.targetAmount,
      }
    })
  }, [savingsGoals])

  // Gráfico de evolução temporal (Line Chart) - acumulado ao longo do tempo
  const evolutionChart = useMemo(() => {
    const allDeposits = savingsGoals.flatMap((goal) =>
      goal.deposits.map((deposit) => ({
        date: deposit.date,
        amount: deposit.amount,
        goalName: goal.name,
      })),
    )

    if (allDeposits.length === 0) return []

    // Agrupa por data e calcula acumulado
    const depositsByDate = allDeposits.reduce<Record<string, number>>((acc, deposit) => {
      acc[deposit.date] = (acc[deposit.date] || 0) + deposit.amount
      return acc
    }, {})

    // Ordena por data e calcula acumulado
    const sortedDates = Object.keys(depositsByDate).sort()
    let accumulated = 0
    return sortedDates.map((date) => {
      accumulated += depositsByDate[date]
      return {
        date: new Date(date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        amount: depositsByDate[date],
        accumulated,
      }
    })
  }, [savingsGoals])

  // Gráfico de depósitos mensais (Bar Chart)
  const monthlyDepositsChart = useMemo(() => {
    const allDeposits = savingsGoals.flatMap((goal) => goal.deposits)

    if (allDeposits.length === 0) return []

    const depositsByMonth = allDeposits.reduce<Record<string, { amount: number; sortKey: string }>>((acc, deposit) => {
      const date = new Date(deposit.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      
      if (!acc[monthLabel]) {
        acc[monthLabel] = { amount: 0, sortKey: monthKey }
      }
      acc[monthLabel].amount += deposit.amount
      return acc
    }, {})

    return Object.entries(depositsByMonth)
      .map(([month, data]) => ({ month, amount: data.amount, sortKey: data.sortKey }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ month, amount }) => ({ month, amount }))
  }, [savingsGoals])

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

  const handleCreateGoal = async () => {
    if (!goalForm.name || !goalForm.targetAmount) return
    await actions.addSavingsGoal({
      name: goalForm.name,
      owner: goalForm.owner,
      deadline: goalForm.deadline,
      description: goalForm.description,
      targetAmount: Number(goalForm.targetAmount),
    })
    setGoalForm(goalFormDefaults())
  }

  const handleDeposit = async () => {
    if (!depositGoalId || !depositValue) return
    await actions.addDeposit({
      goalId: depositGoalId,
      amount: Number(depositValue),
      date: depositDate,
    })
    setDepositGoalId(null)
    setDepositValue('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Poupança e investimentos</h1>
        <p className="text-sm text-gray-500">Defina objetivos e acompanhe o progresso dos depósitos.</p>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total guardado</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalSaved.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Meta total</p>
          <p className="text-2xl font-bold text-blue-600">R$ {totalTarget.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Progresso geral</p>
          <p className="text-2xl font-bold text-purple-600">
            {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Gráficos */}
      {savingsGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico de distribuição por objetivo */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Distribuição por Objetivo</h3>
            {distributionChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {distributionChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">Nenhum depósito realizado ainda</p>
            )}
          </div>

          {/* Gráfico de progresso por objetivo */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Progresso por Objetivo</h3>
            {progressChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={progressChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'progress') return `${value.toFixed(1)}%`
                      return `R$ ${value.toFixed(2)}`
                    }}
                  />
                  <Bar dataKey="progress" fill="#10b981" name="Progresso (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">Nenhum objetivo cadastrado</p>
            )}
          </div>

          {/* Gráfico de evolução temporal */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Evolução do Acumulado</h3>
            {evolutionChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accumulated"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total Acumulado"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Depósito do Dia"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">Nenhum depósito realizado ainda</p>
            )}
          </div>

          {/* Gráfico de depósitos mensais */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Depósitos Mensais</h3>
            {monthlyDepositsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyDepositsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#8b5cf6" name="Valor Depositado" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">Nenhum depósito realizado ainda</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="text-lg font-semibold">Novo objetivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">
            Nome
            <input
              type="text"
              value={goalForm.name}
              onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Responsável
            <select
              value={goalForm.owner}
              onChange={(event) => setGoalForm({ ...goalForm, owner: event.target.value as Person })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            >
              <option value="Kaio">Kaio</option>
              <option value="Gabriela">Gabriela</option>
              <option value="Ambos">Ambos</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Valor alvo (R$)
            <input
              type="number"
              step="0.01"
              value={goalForm.targetAmount}
              onChange={(event) => setGoalForm({ ...goalForm, targetAmount: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Prazo
            <input
              type="date"
              value={goalForm.deadline}
              onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Descrição
            <input
              type="text"
              value={goalForm.description}
              onChange={(event) => setGoalForm({ ...goalForm, description: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button onClick={handleCreateGoal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus size={16} className="inline mr-2" />
            Criar objetivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savingsGoals.map((goal) => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100
          return (
            <div key={goal.id} className="bg-white rounded-lg shadow p-4 space-y-3 border border-gray-100">
              <div className="flex justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-800">{goal.name}</p>
                  <p className="text-sm text-gray-500">{goal.description || 'Sem descrição'}</p>
                </div>
                <button
                  onClick={() => actions.deleteSavingsGoal(goal.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-green-500"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>R$ {goal.currentAmount.toFixed(2)}</span>
                  <span>R$ {goal.targetAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onClick={() => setDepositGoalId(goal.id)}
                >
                  Adicionar depósito
                </button>
                {goal.deadline && (
                  <span className="px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-600">
                    até {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              {depositGoalId === goal.id && (
                <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-sm text-gray-700">
                      Valor (R$)
                      <input
                        type="number"
                        step="0.01"
                        value={depositValue}
                        onChange={(event) => setDepositValue(event.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-lg"
                      />
                    </label>
                    <label className="text-sm text-gray-700">
                      Data
                      <input
                        type="date"
                        value={depositDate}
                        onChange={(event) => setDepositDate(event.target.value)}
                        className="mt-1 w-full px-3 py-2 border rounded-lg"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-2 border rounded-lg text-sm" onClick={() => setDepositGoalId(null)}>
                      Cancelar
                    </button>
                    <button
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm"
                      onClick={handleDeposit}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {savingsGoals.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-6">Crie seu primeiro objetivo para começar a acompanhar.</p>
      )}
    </div>
  )
}

