import { useMemo, useState } from 'react'
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
import type { BudgetPayload, Person, Transaction } from '../types/finance'
import { MonthYearSelector } from '../components/MonthYearSelector'

interface BudgetHealthViewProps {
  selectedMonth: string
  onMonthChange: (value: string) => void
  transactions: Transaction[]
}

const defaultForm = (competency: string): Omit<BudgetPayload, 'amount'> & { amount: string } => ({
  competency,
  category: 'Alimentação',
  person: 'Kaio',
  amount: '',
})

export const BudgetHealthView: React.FC<BudgetHealthViewProps> = ({ selectedMonth, onMonthChange, transactions }) => {
  const {
    state: { budgets, categories },
    actions,
  } = useFinance()

  const [form, setForm] = useState(defaultForm(selectedMonth))

  const filteredBudgets = useMemo(() => budgets.filter((budget) => budget.competency === selectedMonth), [budgets, selectedMonth])

  const enrichedBudgets = useMemo(() => {
    return filteredBudgets.map((budget) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.type === 'Despesa' &&
            transaction.category === budget.category &&
            transaction.person === budget.person,
        )
        .reduce((sum, transaction) => sum + transaction.value, 0)
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        percentage,
      }
    })
  }, [filteredBudgets, transactions])

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const totalBudgeted = enrichedBudgets.reduce((sum, budget) => sum + budget.amount, 0)
    const totalSpent = enrichedBudgets.reduce((sum, budget) => sum + budget.spent, 0)
    const totalRemaining = enrichedBudgets.reduce((sum, budget) => sum + budget.remaining, 0)
    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overallProgress: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    }
  }, [enrichedBudgets])

  // Gráfico de orçado vs gasto
  const budgetVsSpentChart = useMemo(() => {
    return enrichedBudgets.map((budget) => ({
      name: budget.category.length > 12 ? budget.category.substring(0, 12) + '...' : budget.category,
      orcado: budget.amount,
      gasto: budget.spent,
      pessoa: budget.person,
    }))
  }, [enrichedBudgets])

  // Gráfico de progresso por categoria
  const progressChart = useMemo(() => {
    return enrichedBudgets.map((budget) => ({
      name: budget.category.length > 15 ? budget.category.substring(0, 15) + '...' : budget.category,
      progresso: Math.min(budget.percentage, 100),
      pessoa: budget.person,
    }))
  }, [enrichedBudgets])

  // Gráfico de distribuição por pessoa
  const byPersonChart = useMemo(() => {
    const byPerson = enrichedBudgets.reduce<Record<string, { budgeted: number; spent: number }>>(
      (acc, budget) => {
        if (!acc[budget.person]) {
          acc[budget.person] = { budgeted: 0, spent: 0 }
        }
        acc[budget.person].budgeted += budget.amount
        acc[budget.person].spent += budget.spent
        return acc
      },
      {},
    )
    return Object.entries(byPerson).map(([person, data]) => ({
      name: person,
      orcado: data.budgeted,
      gasto: data.spent,
    }))
  }, [enrichedBudgets])

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#ec4899']

  const handleSubmit = async () => {
    if (!form.amount) return
    await actions.addBudget({
      competency: form.competency,
      category: form.category,
      person: form.person,
      amount: Number(form.amount),
    })
    setForm(defaultForm(selectedMonth))
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho destacado */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Planejamento Financeiro</h1>
            <p className="text-purple-100">Defina e acompanhe orçamentos mensais por categoria e pessoa.</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <MonthYearSelector
              value={selectedMonth}
              onChange={(value) => {
                onMonthChange(value)
                setForm((prev) => ({ ...prev, competency: value }))
              }}
              className="text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Estatísticas gerais - Cards destacados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-700">Total Orçado</p>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">R$ {totalStats.totalBudgeted.toFixed(2)}</p>
          <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-lg p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-red-700">Total Gasto</p>
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-3xl font-bold text-red-600">R$ {totalStats.totalSpent.toFixed(2)}</p>
          <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${Math.min(totalStats.overallProgress, 100)}%` }}
            />
          </div>
        </div>
        <div className={`bg-gradient-to-br rounded-lg shadow-lg p-5 border-l-4 ${
          totalStats.totalRemaining >= 0 
            ? 'from-green-50 to-green-100 border-green-500' 
            : 'from-orange-50 to-orange-100 border-orange-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-medium ${totalStats.totalRemaining >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
              Saldo Restante
            </p>
            <span className="text-2xl">{totalStats.totalRemaining >= 0 ? '✅' : '⚠️'}</span>
          </div>
          <p className={`text-3xl font-bold ${totalStats.totalRemaining >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
            R$ {totalStats.totalRemaining.toFixed(2)}
          </p>
          <div className={`mt-2 h-2 rounded-full overflow-hidden ${
            totalStats.totalRemaining >= 0 ? 'bg-green-200' : 'bg-orange-200'
          }`}>
            <div
              className={`h-full rounded-full ${
                totalStats.totalRemaining >= 0 ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min((Math.abs(totalStats.totalRemaining) / totalStats.totalBudgeted) * 100, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-700">Progresso Geral</p>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{totalStats.overallProgress.toFixed(1)}%</p>
          <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                totalStats.overallProgress > 100 ? 'bg-red-500' : 
                totalStats.overallProgress > 80 ? 'bg-orange-500' : 
                'bg-purple-500'
              }`}
              style={{ width: `${Math.min(totalStats.overallProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      {enrichedBudgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico de orçado vs gasto */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Orçado vs Gasto por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetVsSpentChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="orcado" fill="#3b82f6" name="Orçado" />
                <Bar dataKey="gasto" fill="#ef4444" name="Gasto" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de progresso por categoria */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Progresso por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="progresso" fill="#8b5cf6" name="Progresso (%)">
                  {progressChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.progresso > 100 ? '#ef4444' : entry.progresso > 80 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de distribuição por pessoa */}
          <div className="bg-white rounded-lg shadow p-4 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Orçado vs Gasto por Pessoa</h3>
            {byPersonChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byPersonChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="orcado" fill="#3b82f6" name="Orçado" />
                  <Bar dataKey="gasto" fill="#ef4444" name="Gasto" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      )}

      {/* Formulário de novo orçamento - Destacado */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-lg p-6 border-2 border-green-200 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">➕</span>
          <h3 className="text-xl font-bold text-gray-800">Novo Orçamento</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-gray-700">
            Competência
            <input
              type="text"
              value={form.competency}
              onChange={(event) => setForm({ ...form, competency: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Categoria
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Pessoa
            <select
              value={form.person}
              onChange={(event) => setForm({ ...form, person: event.target.value as Person })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            >
              <option value="Kaio">Kaio</option>
              <option value="Gabriela">Gabriela</option>
              <option value="Ambos">Ambos</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Valor (R$)
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Salvar orçamento
          </button>
        </div>
      </div>

      {/* Tabela de orçamentos - Melhorada */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📋</span> Orçamentos do Mês
          </h3>
        </div>
        {enrichedBudgets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoria</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pessoa</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Orçado</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Gasto</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Saldo</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Progresso</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrichedBudgets.map((budget) => {
                  const isOverBudget = budget.percentage > 100
                  const isWarning = budget.percentage > 80 && budget.percentage <= 100
                  return (
                    <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{budget.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          budget.person === 'Kaio' ? 'bg-blue-100 text-blue-700' :
                          budget.person === 'Gabriela' ? 'bg-pink-100 text-pink-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {budget.person}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">
                        R$ {budget.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                        R$ {budget.spent.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-bold ${
                          budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {budget.remaining >= 0 ? '+' : '-'}R$ {Math.abs(budget.remaining).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOverBudget ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            isOverBudget ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {budget.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => actions.deleteBudget(budget.id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium text-gray-600 mb-2">Nenhum orçamento definido para este mês</p>
            <p className="text-sm text-gray-500">Use o formulário acima para criar seu primeiro orçamento</p>
          </div>
        )}
      </div>
    </div>
  )
}

