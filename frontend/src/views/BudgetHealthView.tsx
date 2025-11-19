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
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Planejamento</h1>
          <p className="text-sm text-gray-500">Defina e acompanhe orçamentos mensais por categoria.</p>
        </div>
        <input
          type="text"
          value={selectedMonth}
          onChange={(event) => {
            onMonthChange(event.target.value)
            setForm((prev) => ({ ...prev, competency: event.target.value }))
          }}
          className="px-3 py-2 border rounded-lg"
          placeholder="MM/AAAA"
        />
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Orçado</p>
          <p className="text-2xl font-bold text-blue-600">R$ {totalStats.totalBudgeted.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Gasto</p>
          <p className="text-2xl font-bold text-red-600">R$ {totalStats.totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Saldo Restante</p>
          <p className={`text-2xl font-bold ${totalStats.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {totalStats.totalRemaining.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Progresso Geral</p>
          <p className="text-2xl font-bold text-purple-600">{totalStats.overallProgress.toFixed(1)}%</p>
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

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="text-lg font-semibold">Novo orçamento</h3>
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

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoria</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pessoa</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Orçado</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Gasto</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Saldo</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enrichedBudgets.map((budget) => (
              <tr key={budget.id}>
                <td className="px-4 py-3 text-sm">{budget.category}</td>
                <td className="px-4 py-3 text-sm">{budget.person}</td>
                <td className="px-4 py-3 text-sm text-right">R$ {budget.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">R$ {budget.spent.toFixed(2)}</td>
                <td
                  className={`px-4 py-3 text-sm text-right ${
                    budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {budget.remaining >= 0 ? '+' : '-'}R$ {Math.abs(budget.remaining).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <button
                    onClick={() => actions.deleteBudget(budget.id)}
                    className="px-3 py-1 text-red-600 hover:text-red-800"
                  >
                    remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {enrichedBudgets.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-6">Nenhum orçamento definido para este mês.</p>
        )}
      </div>
    </div>
  )
}

