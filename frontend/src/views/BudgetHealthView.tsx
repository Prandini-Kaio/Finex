import { useMemo, useState, useEffect } from 'react'
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
import { useTheme } from '../context/ThemeContext'
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
  const { theme } = useTheme()

  const [form, setForm] = useState(defaultForm(selectedMonth))
  
  // Cores para dark mode
  const isDark = theme.mode === 'dark'
  const gridColor = isDark ? '#475569' : '#e5e7eb'
  const textColor = isDark ? '#cbd5e1' : '#6b7280'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e5e7eb'
  const tooltipText = isDark ? '#e2e8f0' : '#111827'

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
          <div className="bg-white/20 dark:bg-slate-700/50 rounded-lg px-4 py-2">
            <MonthYearSelector
              value={selectedMonth}
              onChange={(value) => {
                onMonthChange(value)
                setForm((prev) => ({ ...prev, competency: value }))
              }}
              className="text-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Estatísticas gerais - Cards destacados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-lg p-5 border-l-4 border-blue-500 dark:border-blue-600">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Orçado</p>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">R$ {totalStats.totalBudgeted.toFixed(2)}</p>
          <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 dark:bg-blue-600 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg shadow-lg p-5 border-l-4 border-red-500 dark:border-red-600">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Total Gasto</p>
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">R$ {totalStats.totalSpent.toFixed(2)}</p>
          <div className="mt-2 h-2 bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 dark:bg-red-600 rounded-full"
              style={{ width: `${Math.min(totalStats.overallProgress, 100)}%` }}
            />
          </div>
        </div>
        <div className={`bg-gradient-to-br rounded-lg shadow-lg p-5 border-l-4 ${
          totalStats.totalRemaining >= 0 
            ? 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-500 dark:border-green-600' 
            : 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-500 dark:border-orange-600'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-medium ${totalStats.totalRemaining >= 0 ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
              Saldo Restante
            </p>
            <span className="text-2xl">{totalStats.totalRemaining >= 0 ? '✅' : '⚠️'}</span>
          </div>
          <p className={`text-3xl font-bold ${totalStats.totalRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
            R$ {totalStats.totalRemaining.toFixed(2)}
          </p>
          <div className={`mt-2 h-2 rounded-full overflow-hidden ${
            totalStats.totalRemaining >= 0 ? 'bg-green-200 dark:bg-green-800' : 'bg-orange-200 dark:bg-orange-800'
          }`}>
            <div
              className={`h-full rounded-full ${
                totalStats.totalRemaining >= 0 ? 'bg-green-500 dark:bg-green-600' : 'bg-orange-500 dark:bg-orange-600'
              }`}
              style={{ width: `${Math.min((Math.abs(totalStats.totalRemaining) / totalStats.totalBudgeted) * 100, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg shadow-lg p-5 border-l-4 border-purple-500 dark:border-purple-600">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Progresso Geral</p>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalStats.overallProgress.toFixed(1)}%</p>
          <div className="mt-2 h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                totalStats.overallProgress > 100 ? 'bg-red-500 dark:bg-red-600' : 
                totalStats.overallProgress > 80 ? 'bg-orange-500 dark:bg-orange-600' : 
                'bg-purple-500 dark:bg-purple-600'
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Orçado vs Gasto por Categoria</h3>
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Progresso por Categoria</h3>
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Orçado vs Gasto por Pessoa</h3>
            {byPersonChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byPersonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis 
                    dataKey="name" 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                  />
                  <YAxis 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                  />
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Legend 
                    wrapperStyle={{ color: textColor }}
                  />
                  <Bar dataKey="orcado" fill="#3b82f6" name="Orçado" />
                  <Bar dataKey="gasto" fill="#ef4444" name="Gasto" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      )}

      {/* Formulário de novo orçamento - Destacado */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg shadow-lg p-6 border-2 border-green-200 dark:border-green-700 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">➕</span>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Novo Orçamento</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Competência
            <input
              type="text"
              value={form.competency}
              onChange={(event) => setForm({ ...form, competency: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pessoa
            <select
              value={form.person}
              onChange={(event) => setForm({ ...form, person: event.target.value as Person })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Kaio">Kaio</option>
              <option value="Gabriela">Gabriela</option>
              <option value="Ambos">Ambos</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Valor (R$)
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSubmit} className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 transition-opacity">
            Salvar orçamento
          </button>
        </div>
      </div>

      {/* Tabela de orçamentos - Melhorada */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span>📋</span> Orçamentos do Mês
          </h3>
        </div>
        {enrichedBudgets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Pessoa</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Orçado</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Gasto</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Saldo</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Progresso</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {enrichedBudgets.map((budget) => {
                  const isOverBudget = budget.percentage > 100
                  const isWarning = budget.percentage > 80 && budget.percentage <= 100
                  return (
                    <tr key={budget.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">{budget.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          budget.person === 'Kaio' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          budget.person === 'Gabriela' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' :
                          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}>
                          {budget.person}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-700 dark:text-gray-300">
                        R$ {budget.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-red-600 dark:text-red-400">
                        R$ {budget.spent.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-bold ${
                          budget.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {budget.remaining >= 0 ? '+' : '-'}R$ {Math.abs(budget.remaining).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOverBudget ? 'bg-red-500 dark:bg-red-600' : isWarning ? 'bg-orange-500 dark:bg-orange-600' : 'bg-green-500 dark:bg-green-600'
                              }`}
                              style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            isOverBudget ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {budget.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => actions.deleteBudget(budget.id)}
                          className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium"
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
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Nenhum orçamento definido para este mês</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Use o formulário acima para criar seu primeiro orçamento</p>
          </div>
        )}
      </div>
    </div>
  )
}

