import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import type { BankAccount, BankAccountPayload } from '../types/finance'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { formatBRL } from '../utils/formatBRL'

const emptyForm = (): BankAccountPayload => ({
  name: '',
  institution: '',
  ownerId: 0,
  initialBalance: 0,
  active: true,
})

export const BankAccountsView: React.FC = () => {
  const {
    state: { bankAccounts, persons },
    actions,
  } = useFinance()

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<BankAccountPayload>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const activePersons = useMemo(() => persons.filter((p) => p.active), [persons])
  const totalBalance = useMemo(
    () => bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0),
    [bankAccounts],
  )

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyForm(),
      ownerId: activePersons[0]?.id ?? 0,
    })
    setShowModal(true)
  }

  const openEdit = (account: BankAccount) => {
    setEditingId(account.id)
    setForm({
      name: account.name,
      institution: account.institution ?? '',
      ownerId: account.ownerId,
      initialBalance: account.initialBalance,
      active: account.active,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.ownerId) return
    setSubmitting(true)
    try {
      if (editingId) {
        await actions.updateBankAccount(editingId, form)
      } else {
        await actions.addBankAccount(form)
      }
      setShowModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Saldo total em contas</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{formatBRL(totalBalance)}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} /> Nova conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map((account) => (
          <Card key={account.id}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{account.name}</h3>
                {account.institution && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{account.institution}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Titular: {account.owner}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(account)}
                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => confirm('Excluir esta conta?') && void actions.deleteBankAccount(account.id)}
                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-2xl font-bold mt-4 text-primary">{formatBRL(account.currentBalance)}</p>
          </Card>
        ))}
      </div>

      {bankAccounts.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma conta cadastrada. Crie uma conta para rastrear saldos.
          </p>
        </Card>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar conta' : 'Nova conta bancária'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Instituição
            <input
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Titular
            <select
              value={form.ownerId}
              onChange={(e) => setForm({ ...form, ownerId: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              {activePersons.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Saldo inicial (R$)
            <input
              type="number"
              step="0.01"
              value={form.initialBalance}
              onChange={(e) => setForm({ ...form, initialBalance: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
