import { useMemo, useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, Target, Award, Sparkles, Calendar, DollarSign, List, Edit2 } from 'lucide-react'
import { financeService } from '../services/financeService'
import type { SavingsDeposit } from '../types/finance'
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
import type { SavingsGoalPayload } from '../types/finance'
import { getPersonIdByName } from '../utils/finance'

const goalFormDefaults = (): Omit<SavingsGoalPayload, 'targetAmount' | 'ownerId'> & { targetAmount: string; owner: string } => ({
  name: '',
  owner: 'Kaio',
  deadline: '',
  description: '',
  targetAmount: '',
})

export const SavingsView: React.FC = () => {
  const {
    state: { savingsGoals, persons },
    actions,
  } = useFinance()

  const [goalForm, setGoalForm] = useState(goalFormDefaults())
  const [depositGoalId, setDepositGoalId] = useState<number | null>(null)
  const [depositValue, setDepositValue] = useState('')
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0])
  const [depositPerson, setDepositPerson] = useState<string>(persons.find(p => p.active)?.name || '')
  const [depositObservacao, setDepositObservacao] = useState('')
  const [showAllDeposits, setShowAllDeposits] = useState(false)
  const [allDeposits, setAllDeposits] = useState<SavingsDeposit[]>([])
  const [loadingDeposits, setLoadingDeposits] = useState(false)
  const [editingDepositId, setEditingDepositId] = useState<number | null>(null)
  const [editDepositValue, setEditDepositValue] = useState('')
  const [editDepositDate, setEditDepositDate] = useState('')
  const [editDepositPerson, setEditDepositPerson] = useState('')
  const [editDepositObservacao, setEditDepositObservacao] = useState('')
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null)
  const [editGoalName, setEditGoalName] = useState('')
  const [editGoalTargetAmount, setEditGoalTargetAmount] = useState('')
  const [editGoalDeadline, setEditGoalDeadline] = useState('')
  const [editGoalDescription, setEditGoalDescription] = useState('')
  const [editGoalOwner, setEditGoalOwner] = useState('')
  const [showDepositsForGoal, setShowDepositsForGoal] = useState<number | null>(null)

  useEffect(() => {
    if (showAllDeposits) {
      setLoadingDeposits(true)
      financeService.getAllDeposits()
        .then(setAllDeposits)
        .catch(console.error)
        .finally(() => setLoadingDeposits(false))
    }
  }, [showAllDeposits, savingsGoals])

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
    const ownerId = getPersonIdByName(persons, goalForm.owner)
    if (!ownerId) return
    await actions.addSavingsGoal({
      name: goalForm.name,
      ownerId,
      deadline: goalForm.deadline,
      description: goalForm.description,
      targetAmount: Number(goalForm.targetAmount),
    })
    setGoalForm(goalFormDefaults())
  }

  const handleDeposit = async () => {
    if (!depositGoalId || !depositValue) return
    const personId = getPersonIdByName(persons, depositPerson)
    if (!personId) return
    await actions.addDeposit({
      goalId: depositGoalId,
      amount: Number(depositValue),
      date: depositDate,
      personId,
      observacao: depositObservacao || undefined,
    })
    setDepositGoalId(null)
    setDepositValue('')
    setDepositPerson(persons.find(p => p.active)?.name || '')
    setDepositObservacao('')
  }

  const handleStartEditDeposit = (deposit: SavingsDeposit) => {
    setEditingDepositId(deposit.id)
    setEditDepositValue(deposit.amount.toString())
    setEditDepositDate(deposit.date)
    setEditDepositPerson(deposit.person || persons.find(p => p.active)?.name || '')
    setEditDepositObservacao(deposit.observacao || '')
  }

  const handleCancelEditDeposit = () => {
    setEditingDepositId(null)
    setEditDepositValue('')
    setEditDepositDate('')
    setEditDepositPerson('')
    setEditDepositObservacao('')
  }

  const handleSaveEditDeposit = async () => {
    if (!editingDepositId || !editDepositValue) return
    const personId = getPersonIdByName(persons, editDepositPerson)
    if (!personId) return
    await actions.updateDeposit(editingDepositId, {
      amount: Number(editDepositValue),
      date: editDepositDate,
      personId,
      observacao: editDepositObservacao || undefined,
    })
    handleCancelEditDeposit()
  }

  const handleStartEditGoal = (goal: typeof savingsGoals[0]) => {
    setEditingGoalId(goal.id)
    setEditGoalName(goal.name)
    setEditGoalTargetAmount(goal.targetAmount.toString())
    setEditGoalDeadline(goal.deadline || '')
    setEditGoalDescription(goal.description || '')
    setEditGoalOwner(goal.owner)
  }

  const handleCancelEditGoal = () => {
    setEditingGoalId(null)
    setEditGoalName('')
    setEditGoalTargetAmount('')
    setEditGoalDeadline('')
    setEditGoalDescription('')
    setEditGoalOwner('')
  }

  const handleSaveEditGoal = async () => {
    if (!editingGoalId || !editGoalName || !editGoalTargetAmount) return
    const ownerId = getPersonIdByName(persons, editGoalOwner)
    if (!ownerId) return
    await actions.updateSavingsGoal(editingGoalId, {
      name: editGoalName,
      ownerId,
      deadline: editGoalDeadline || undefined,
      description: editGoalDescription || undefined,
      targetAmount: Number(editGoalTargetAmount),
    })
    handleCancelEditGoal()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Poupança e investimentos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Defina objetivos e acompanhe o progresso dos depósitos.</p>
      </div>

      {/* Estatísticas gerais - Cards visuais e motivadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl shadow-lg p-6 border-l-4 border-green-500 dark:border-green-600 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
              <DollarSign className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Total Guardado</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">R$ {totalSaved.toFixed(2)}</p>
          <div className="mt-3 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <TrendingUp size={14} />
            <span>Seu patrimônio está crescendo!</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-lg p-6 border-l-4 border-blue-500 dark:border-blue-600 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Target className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Meta Total</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">R$ {totalTarget.toFixed(2)}</p>
          <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
            <Target size={14} />
            <span>{savingsGoals.length} objetivo{savingsGoals.length !== 1 ? 's' : ''} definido{savingsGoals.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl shadow-lg p-6 border-l-4 border-purple-500 dark:border-purple-600 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
              <Award className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <span className="text-3xl">🏆</span>
          </div>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Progresso Geral</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%
          </p>
          <div className="mt-3 w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-purple-500 dark:bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      {savingsGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico de distribuição por objetivo */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Distribuição por Objetivo</h3>
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
                    label={({ name, value }) => {
                      const percentage = totalSaved > 0 ? ((value / totalSaved) * 100).toFixed(1) : '0'
                      return `${name}: ${percentage}%`
                    }}
                  >
                    {distributionChart.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">Nenhum depósito realizado ainda</p>
            )}
          </div>

          {/* Gráfico de progresso por objetivo */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Progresso por Objetivo</h3>
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
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">Nenhum objetivo cadastrado</p>
            )}
          </div>

          {/* Gráfico de evolução temporal */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Evolução do Acumulado</h3>
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
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">Nenhum depósito realizado ainda</p>
            )}
          </div>

          {/* Gráfico de depósitos mensais */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Depósitos Mensais</h3>
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
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">Nenhum depósito realizado ainda</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-lg p-6 space-y-4 border-2 border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
            <Target className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Novo Objetivo</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome
            <input
              type="text"
              value={goalForm.name}
              onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Responsável
            <select
              value={goalForm.owner}
              onChange={(event) => setGoalForm({ ...goalForm, owner: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            >
              {persons.filter(p => p.active).map((person) => (
                <option key={person.id} value={person.name}>{person.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Valor alvo (R$)
            <input
              type="number"
              step="0.01"
              value={goalForm.targetAmount}
              onChange={(event) => setGoalForm({ ...goalForm, targetAmount: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Prazo
            <input
              type="date"
              value={goalForm.deadline}
              onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Descrição
            <input
              type="text"
              value={goalForm.description}
              onChange={(event) => setGoalForm({ ...goalForm, description: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
        </div>
        <div className="flex justify-end pt-2">
          <button 
            onClick={handleCreateGoal} 
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Criar Objetivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savingsGoals.map((goal) => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100
          const isComplete = percentage >= 100
          const isNearComplete = percentage >= 80 && percentage < 100
          const remaining = goal.targetAmount - goal.currentAmount
          const depositsCount = goal.deposits.length
          
          // Mensagem motivacional baseada no progresso
          const getMotivationalMessage = () => {
            if (isComplete) return { text: '🎉 Objetivo Conquistado!', color: 'text-green-600 dark:text-green-400' }
            if (isNearComplete) return { text: '🔥 Quase lá! Continue assim!', color: 'text-orange-600 dark:text-orange-400' }
            if (percentage >= 50) return { text: '💪 Mais da metade do caminho!', color: 'text-blue-600 dark:text-blue-400' }
            if (percentage > 0) return { text: '✨ Bom começo! Continue!', color: 'text-purple-600 dark:text-purple-400' }
            return { text: '🚀 Vamos começar essa jornada!', color: 'text-gray-600 dark:text-gray-400' }
          }
          
          const motivation = getMotivationalMessage()
          
          return (
            <div 
              key={goal.id} 
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-4 border-2 transition-all duration-300 hover:shadow-xl ${
                isComplete 
                  ? 'border-green-500 dark:border-green-600 bg-gradient-to-br from-green-50/50 to-white dark:from-green-900/20 dark:to-slate-800' 
                  : isNearComplete
                  ? 'border-orange-400 dark:border-orange-600 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-900/20 dark:to-slate-800'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              {/* Header com badge de conquista */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editingGoalId === goal.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nome
                          <input
                            type="text"
                            value={editGoalName}
                            onChange={(e) => setEditGoalName(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Responsável
                          <select
                            value={editGoalOwner}
                            onChange={(e) => setEditGoalOwner(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          >
                            {persons.filter(p => p.active).map((person) => (
                              <option key={person.id} value={person.name}>{person.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Valor alvo (R$)
                          <input
                            type="number"
                            step="0.01"
                            value={editGoalTargetAmount}
                            onChange={(e) => setEditGoalTargetAmount(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Prazo
                          <input
                            type="date"
                            value={editGoalDeadline}
                            onChange={(e) => setEditGoalDeadline(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                          Descrição
                          <input
                            type="text"
                            value={editGoalDescription}
                            onChange={(e) => setEditGoalDescription(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelEditGoal}
                          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEditGoal}
                          className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{goal.name}</h3>
                        {isComplete && (
                          <span className="px-2 py-1 bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                            <Award size={12} /> Conquistado!
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{goal.description || 'Sem descrição'}</p>
                      <p className={`text-sm font-semibold ${motivation.color} flex items-center gap-1`}>
                        <Sparkles size={14} />
                        {motivation.text}
                      </p>
                    </>
                  )}
                </div>
                {editingGoalId !== goal.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStartEditGoal(goal)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Editar objetivo"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => actions.deleteSavingsGoal(goal.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Progresso visual melhorado */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Progresso</span>
                  <span className={`font-bold text-lg ${
                    isComplete ? 'text-green-600 dark:text-green-400' :
                    isNearComplete ? 'text-orange-600 dark:text-orange-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600' 
                        : isNearComplete
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      R$ {goal.currentAmount.toFixed(2)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">de</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      R$ {goal.targetAmount.toFixed(2)}
                    </span>
                  </div>
                  {!isComplete && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Faltam R$ {remaining.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Lista completa de depósitos */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={12} />
                    Depósitos ({depositsCount})
                  </span>
                  {goal.deposits.length > 0 && (
                    <button
                      onClick={() => setShowDepositsForGoal(showDepositsForGoal === goal.id ? null : goal.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {showDepositsForGoal === goal.id ? 'Ocultar' : 'Ver todos'}
                    </button>
                  )}
                </div>
                {goal.deposits.length > 0 ? (
                  <div className="space-y-1.5">
                    {goal.deposits
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, showDepositsForGoal === goal.id ? goal.deposits.length : 3)
                      .map((deposit) => (
                        <div key={deposit.id}>
                          {editingDepositId === deposit.id ? (
                            <div className="space-y-2 bg-white dark:bg-slate-800 rounded-lg p-3 border-2 border-blue-300 dark:border-blue-700">
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Valor (R$)
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editDepositValue}
                                    onChange={(e) => setEditDepositValue(e.target.value)}
                                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                  />
                                </label>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Data
                                  <input
                                    type="date"
                                    value={editDepositDate}
                                    onChange={(e) => setEditDepositDate(e.target.value)}
                                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                  />
                                </label>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 col-span-2">
                                  Pessoa
                                  <select
                                    value={editDepositPerson}
                                    onChange={(e) => setEditDepositPerson(e.target.value)}
                                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                  >
                                    {persons.filter(p => p.active).map((person) => (
                                      <option key={person.id} value={person.name}>{person.name}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 col-span-2">
                                  Observação
                                  <input
                                    type="text"
                                    value={editDepositObservacao}
                                    onChange={(e) => setEditDepositObservacao(e.target.value)}
                                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Opcional"
                                  />
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleCancelEditDeposit}
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={handleSaveEditDeposit}
                                  className="flex-1 px-2 py-1 text-xs bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 rounded px-2 py-1.5 border border-gray-200 dark:border-slate-600">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-gray-600 dark:text-gray-300">
                                  {new Date(deposit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: showDepositsForGoal === goal.id ? 'numeric' : undefined })}
                                </span>
                                {deposit.person && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-medium">
                                    {deposit.person}
                                  </span>
                                )}
                                {deposit.observacao && (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex-1" title={deposit.observacao}>
                                    {deposit.observacao}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  +R$ {deposit.amount.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => handleStartEditDeposit(deposit)}
                                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                  title="Editar depósito"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    {goal.deposits.length > 3 && showDepositsForGoal !== goal.id && (
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-1">
                        +{goal.deposits.length - 3} depósito{goal.deposits.length - 3 !== 1 ? 's' : ''} anterior{goal.deposits.length - 3 !== 1 ? 'es' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 py-2">Nenhum depósito ainda</p>
                )}
              </div>

              {/* Informações adicionais */}
              <div className="flex flex-wrap gap-2 text-xs">
                {goal.deadline && (
                  <span className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <Calendar size={12} />
                    até {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  {goal.owner}
                </span>
                {depositsCount > 0 && (
                  <span className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    {depositsCount} depósito{depositsCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                <button
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  onClick={() => setDepositGoalId(goal.id)}
                >
                  <Plus size={16} />
                  Adicionar Depósito
                </button>
              </div>
              {depositGoalId === goal.id && (
                <div className="space-y-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="text-green-600 dark:text-green-400" size={18} />
                    <h4 className="font-semibold text-green-700 dark:text-green-300">Novo Depósito</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Valor (R$)
                      <input
                        type="number"
                        step="0.01"
                        value={depositValue}
                        onChange={(event) => setDepositValue(event.target.value)}
                        className="mt-1 w-full px-3 py-2 border-2 border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0.00"
                      />
                    </label>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Data
                      <input
                        type="date"
                        value={depositDate}
                        onChange={(event) => setDepositDate(event.target.value)}
                        className="mt-1 w-full px-3 py-2 border-2 border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </label>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quem depositou
                      <select
                        value={depositPerson}
                        onChange={(event) => setDepositPerson(event.target.value)}
                        className="mt-1 w-full px-3 py-2 border-2 border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {persons.filter(p => p.active).map((person) => (
                          <option key={person.id} value={person.name}>{person.name}</option>
                        ))}
                        <option value="Ambos">Ambos</option>
                      </select>
                    </label>
                  </div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observação
                    <input
                      type="text"
                      value={depositObservacao}
                      onChange={(event) => setDepositObservacao(event.target.value)}
                      className="mt-1 w-full px-3 py-2 border-2 border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Opcional"
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      className="px-4 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" 
                      onClick={() => setDepositGoalId(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      onClick={handleDeposit}
                    >
                      <Plus size={16} />
                      Confirmar Depósito
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {savingsGoals.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Nenhum objetivo ainda</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Crie seu primeiro objetivo e comece sua jornada de poupança!</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Use o formulário acima para começar ✨</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <List className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Todos os Depósitos</h3>
          </div>
          <button
            onClick={() => setShowAllDeposits(!showAllDeposits)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <List size={16} />
            {showAllDeposits ? 'Ocultar' : 'Ver Todos'}
          </button>
        </div>

        {showAllDeposits && (
          <div className="mt-4">
            {loadingDeposits ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Carregando...</div>
            ) : allDeposits.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhum depósito encontrado</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allDeposits.map((deposit) => {
                  const goal = savingsGoals.find(g => g.deposits.some(d => d.id === deposit.id))
                  return (
                    <div key={deposit.id}>
                      {editingDepositId === deposit.id ? (
                        <div className="space-y-2 bg-white dark:bg-slate-800 rounded-lg p-3 border-2 border-blue-300 dark:border-blue-700">
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Valor (R$)
                              <input
                                type="number"
                                step="0.01"
                                value={editDepositValue}
                                onChange={(e) => setEditDepositValue(e.target.value)}
                                className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                              />
                            </label>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Data
                              <input
                                type="date"
                                value={editDepositDate}
                                onChange={(e) => setEditDepositDate(e.target.value)}
                                className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                              />
                            </label>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 col-span-2">
                              Pessoa
                              <select
                                value={editDepositPerson}
                                onChange={(e) => setEditDepositPerson(e.target.value)}
                                className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                              >
                                {persons.filter(p => p.active).map((person) => (
                                  <option key={person.id} value={person.name}>{person.name}</option>
                                ))}
                              </select>
                            </label>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 col-span-2">
                              Observação
                              <input
                                type="text"
                                value={editDepositObservacao}
                                onChange={(e) => setEditDepositObservacao(e.target.value)}
                                className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                placeholder="Opcional"
                              />
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCancelEditDeposit}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveEditDeposit}
                              className="flex-1 px-2 py-1 text-xs bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {new Date(deposit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              {goal && (
                                <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                                  {goal.name}
                                </span>
                              )}
                              {deposit.person && (
                                <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                  {deposit.person}
                                </span>
                              )}
                            </div>
                            {deposit.observacao && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{deposit.observacao}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-600 dark:text-green-400 ml-4">
                              R$ {deposit.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleStartEditDeposit(deposit)}
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title="Editar depósito"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

