import { useMemo, useState } from 'react'
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

