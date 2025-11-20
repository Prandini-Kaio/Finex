import { useMemo, useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Play } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import type { Person, PaymentMethod, TransactionType, RecurringTransaction, RecurringTransactionPayload } from '../types/finance'
import { MonthYearSelector } from '../components/MonthYearSelector'

type FormState = {
  description: string
  type: TransactionType
  paymentMethod: PaymentMethod
  person: Person
  category: string
  value: string
  startDate: string
  endDate: string
  dayOfMonth: string
  creditCard: string
  active: boolean
  baseCompetency: string
}

const defaultForm = (selectedMonth: string): FormState => ({
  description: '',
  type: 'Despesa',
  paymentMethod: 'Crédito',
  person: 'Kaio',
  category: 'Alimentação',
  value: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  dayOfMonth: '1',
  creditCard: '',
  active: true,
  baseCompetency: selectedMonth,
})

interface RecurringTransactionsViewProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export const RecurringTransactionsView: React.FC<RecurringTransactionsViewProps> = ({
  selectedMonth,
  onMonthChange,
}) => {
  const {
    state: { recurringTransactions, categories, creditCards },
    actions,
  } = useFinance()

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm(selectedMonth))
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Resetar form quando o modal abrir
  useEffect(() => {
    if (showModal && !editingId) {
      setForm(defaultForm(selectedMonth))
    }
  }, [showModal, selectedMonth, editingId])

  const handleSubmit = async () => {
    if (!form.value || !form.description || !form.startDate || !form.dayOfMonth) return
    if (form.paymentMethod === 'Crédito' && !form.creditCard) return

    const payload: RecurringTransactionPayload = {
      description: form.description,
      type: form.type,
      paymentMethod: form.paymentMethod,
      person: form.person,
      category: form.category,
      value: Number(form.value),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      dayOfMonth: Number(form.dayOfMonth),
      creditCardId: form.creditCard ? Number(form.creditCard) : undefined,
      active: form.active,
      baseCompetency: form.baseCompetency || undefined,
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await actions.updateRecurringTransaction(editingId, payload)
      } else {
        await actions.addRecurringTransaction(payload)
      }
      setShowModal(false)
      setEditingId(null)
      setForm(defaultForm(selectedMonth))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (recurring: RecurringTransaction) => {
    setEditingId(recurring.id)
    setForm({
      description: recurring.description,
      type: recurring.type,
      paymentMethod: recurring.paymentMethod,
      person: recurring.person,
      category: recurring.category,
      value: recurring.value.toString(),
      startDate: recurring.startDate,
      endDate: recurring.endDate || '',
      dayOfMonth: recurring.dayOfMonth.toString(),
      creditCard: recurring.creditCardId?.toString() || '',
      active: recurring.active,
      baseCompetency: recurring.baseCompetency || selectedMonth,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este lançamento fixo?')) {
      await actions.deleteRecurringTransaction(id)
    }
  }

  const handleGenerate = async () => {
    if (confirm(`Gerar lançamentos fixos para ${selectedMonth}?`)) {
      setGenerating(true)
      try {
        await actions.generateRecurringTransactions(selectedMonth)
        alert('Lançamentos gerados com sucesso!')
      } catch (error) {
        alert('Erro ao gerar lançamentos: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      } finally {
        setGenerating(false)
      }
    }
  }

  const activeRecurrings = useMemo(
    () => recurringTransactions.filter((r) => r.active),
    [recurringTransactions],
  )

  const inactiveRecurrings = useMemo(
    () => recurringTransactions.filter((r) => !r.active),
    [recurringTransactions],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Lançamentos Fixos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure lançamentos recorrentes que serão gerados automaticamente.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MonthYearSelector value={selectedMonth} onChange={onMonthChange} />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-success text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Play size={20} /> {generating ? 'Gerando...' : 'Gerar para o Mês'}
          </button>
          <button
            onClick={() => {
              setEditingId(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={20} /> Novo Lançamento Fixo
          </button>
        </div>
      </div>

      {/* Lançamentos Ativos */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span>✅</span> Lançamentos Ativos ({activeRecurrings.length})
            </h2>
          </div>
        {activeRecurrings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Pessoa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Categoria</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Período</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Dia</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {activeRecurrings.map((recurring) => (
                  <tr key={recurring.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">{recurring.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recurring.type === 'Receita' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {recurring.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{recurring.person}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{recurring.category}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-700 dark:text-gray-300">
                      R$ {recurring.value.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(recurring.startDate).toLocaleDateString('pt-BR')} até{' '}
                      {recurring.endDate ? new Date(recurring.endDate).toLocaleDateString('pt-BR') : '∞'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">{recurring.dayOfMonth}º</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(recurring)}
                          className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(recurring.id)}
                          className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhum lançamento fixo ativo</p>
          </div>
        )}
      </div>

      {/* Lançamentos Inativos */}
      {inactiveRecurrings.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span>⏸️</span> Lançamentos Inativos ({inactiveRecurrings.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Valor</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {inactiveRecurrings.map((recurring) => (
                  <tr key={recurring.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 opacity-60">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{recurring.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{recurring.type}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">R$ {recurring.value.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(recurring)}
                          className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(recurring.id)}
                          className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
              setEditingId(null)
            }
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {editingId ? 'Editar Lançamento Fixo' : 'Novo Lançamento Fixo'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Descrição
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: Aluguel, Salário, etc."
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
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
                  onChange={(e) => setForm({ ...form, person: e.target.value as Person })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
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
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor (R$)
                <input
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dia do Mês
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dayOfMonth}
                  onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  placeholder="1-31"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Início
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Fim (opcional)
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pagamento
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Crédito">Crédito</option>
                  <option value="Débito">Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                </select>
              </label>
              {form.paymentMethod === 'Crédito' && (
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cartão de Crédito
                  <select
                    value={form.creditCard}
                    onChange={(e) => setForm({ ...form, creditCard: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Selecione</option>
                    {creditCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name} - {card.owner}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="text-sm font-medium text-gray-700 md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Ativo</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingId(null)
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
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

