import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import type { FinanceFilters, PaymentMethod, Person, Transaction, TransactionPayload } from '../types/finance'
import { buildInstallments } from '../utils/finance'

type FormState = {
  date: string
  type: Transaction['type']
  paymentMethod: PaymentMethod
  person: Person
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
    state: { categories, creditCards, closedMonths },
    actions,
  } = useFinance()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm(selectedMonth))
  const [submitting, setSubmitting] = useState(false)

  const isMonthClosed = closedMonths.includes(selectedMonth)

  const handleFilterChange = (key: keyof FinanceFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const handleSubmit = async () => {
    if (!form.value || !form.description) return
    if (form.paymentMethod === 'Crédito' && !form.creditCard) return

    const payloads: TransactionPayload[] = buildInstallments({
      date: form.date,
      type: form.type,
      paymentMethod: form.paymentMethod,
      person: form.person,
      category: form.category,
      description: form.description,
      value: Number(form.value),
      competency: form.competency,
      creditCard: form.creditCard,
      installments: Number(form.installments),
    })

    setSubmitting(true)
    try {
      await actions.addTransactions(payloads)
      setShowModal(false)
      setForm(defaultForm(selectedMonth))
    } finally {
      setSubmitting(false)
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Lançamentos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          disabled={isMonthClosed}
        >
          <Plus size={20} /> Novo Lançamento
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.person}
            onChange={(event) => handleFilterChange('person', event.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="Todos">Todos</option>
            <option value="Kaio">Kaio</option>
            <option value="Gabriela">Gabriela</option>
            <option value="Ambos">Ambos</option>
          </select>
          <select
            value={filters.category}
            onChange={(event) => handleFilterChange('category', event.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="Todas">Todas</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select
            value={filters.paymentType}
            onChange={(event) => handleFilterChange('paymentType', event.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="Todos">Todos</option>
            <option value="Crédito">Crédito</option>
            <option value="Débito">Débito</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="PIX">PIX</option>
          </select>
          <input
            type="text"
            value={selectedMonth}
            placeholder="MM/AAAA"
            className="px-4 py-2 border rounded-lg"
            onChange={(event) => onMonthChange(event.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pessoa</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoria</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pagamento</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Parcelas</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Valor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactionRows.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        transaction.type === 'Despesa' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{transaction.person}</td>
                  <td className="px-4 py-3 text-sm">{transaction.category}</td>
                  <td className="px-4 py-3 text-sm">{transaction.description}</td>
                  <td className="px-4 py-3 text-sm">
                    {transaction.paymentMethod}
                    {transaction.cardName && (
                      <span className="ml-1 text-xs text-gray-500">({transaction.cardName})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {transaction.totalInstallments > 1 ? (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {transaction.installmentNumber}/{transaction.totalInstallments}x
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">À vista</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">R$ {transaction.value.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => actions.deleteTransaction(transaction.id)}
                      disabled={isMonthClosed}
                      className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactionRows.length === 0 && (
            <p className="text-center py-8 text-gray-400">Nenhum lançamento encontrado</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Novo lançamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700">
                Data
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Competência
                <input
                  type="text"
                  value={form.competency}
                  onChange={(event) => setForm({ ...form, competency: event.target.value })}
                  placeholder="MM/AAAA"
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Tipo
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value as Transaction['type'] })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Despesa">Despesa</option>
                  <option value="Receita">Receita</option>
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
              <label className="text-sm font-medium text-gray-700 md:col-span-2">
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
              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                Descrição
                <input
                  type="text"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Valor (R$)
                <input
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(event) => setForm({ ...form, value: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Pagamento
                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm({ ...form, paymentMethod: event.target.value as PaymentMethod })
                  }
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Crédito">Crédito</option>
                  <option value="Débito">Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                </select>
              </label>
              {form.paymentMethod === 'Crédito' && (
                <>
                  <label className="text-sm font-medium text-gray-700">
                    Cartão de crédito
                    <select
                      value={form.creditCard}
                      onChange={(event) => setForm({ ...form, creditCard: event.target.value })}
                      className="mt-1 w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Selecione</option>
                      {creditCards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name} - {card.owner}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Parcelas
                    <select
                      value={form.installments}
                      onChange={(event) => setForm({ ...form, installments: event.target.value })}
                      className="mt-1 w-full px-3 py-2 border rounded-lg"
                    >
                      {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].map((value) => (
                        <option key={value} value={value}>
                          {value}x
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={submitting}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

