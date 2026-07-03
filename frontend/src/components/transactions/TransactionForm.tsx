import { useEffect, useMemo, useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import type { PaymentMethod, Transaction, TransactionPayload } from '../../types/finance'
import { getPersonIdByName } from '../../utils/finance'
import { financeService } from '../../services/financeService'
import { formatBRL } from '../../utils/formatBRL'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

type FormState = {
  date: string
  type: Transaction['type']
  paymentMethod: PaymentMethod
  person: string
  category: string
  description: string
  value: string
  creditCard: string
  bankAccount: string
  installments: string
}

interface TransactionFormProps {
  defaultDate: string
  defaultCategory?: string
  editingTransaction?: Transaction
  onSuccess: () => void
  onCancel: () => void
}

const defaultForm = (date: string, category: string): FormState => ({
  date,
  type: 'Despesa',
  paymentMethod: 'Crédito',
  person: 'Kaio',
  category,
  description: '',
  value: '',
  creditCard: '',
  bankAccount: '',
  installments: '1',
})

export const TransactionForm: React.FC<TransactionFormProps> = ({
  defaultDate,
  defaultCategory = 'Alimentação',
  editingTransaction,
  onSuccess,
  onCancel,
}) => {
  const {
    state: { categories, creditCards, bankAccounts, persons },
    actions,
  } = useFinance()

  const [form, setForm] = useState<FormState>(() =>
    editingTransaction
      ? {
          date: editingTransaction.date,
          type: editingTransaction.type,
          paymentMethod: editingTransaction.paymentMethod,
          person: editingTransaction.person,
          category: editingTransaction.category,
          description: editingTransaction.description,
          value: editingTransaction.value.toString(),
          creditCard: editingTransaction.creditCardId ? String(editingTransaction.creditCardId) : '',
          bankAccount: editingTransaction.bankAccountId ? String(editingTransaction.bankAccountId) : '',
          installments: String(editingTransaction.totalInstallments || 1),
        }
      : defaultForm(defaultDate, defaultCategory),
  )
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof financeService.previewTransaction>> | null>(null)

  const isCredit = form.paymentMethod === 'Crédito'
  const installmentsCount = parseInt(form.installments, 10) || 1
  const personId = getPersonIdByName(persons, form.person)

  const filteredBankAccounts = useMemo(() => {
    const active = bankAccounts.filter((a) => a.active)
    if (form.type === 'Receita') {
      return active
    }
    return active.filter((a) => a.owner === form.person)
  }, [bankAccounts, form.person, form.type])

  useEffect(() => {
    if (!form.value || !personId) {
      setPreview(null)
      return
    }
    const value = Number(form.value)
    if (Number.isNaN(value) || value <= 0) {
      setPreview(null)
      return
    }

    const timer = setTimeout(() => {
      void financeService
        .previewTransaction({
          date: form.date,
          type: form.type,
          paymentMethod: form.paymentMethod,
          value,
          creditCardId: isCredit && form.creditCard ? Number(form.creditCard) : undefined,
          bankAccountId: !isCredit && form.bankAccount ? Number(form.bankAccount) : undefined,
          totalInstallments: isCredit ? installmentsCount : 1,
        })
        .then(setPreview)
        .catch(() => setPreview(null))
    }, 300)

    return () => clearTimeout(timer)
  }, [form, isCredit, installmentsCount, personId])

  const handleSubmit = async () => {
    if (!form.value || !form.description || !personId) return
    if (isCredit && !form.creditCard) return
    if (!isCredit && !form.bankAccount) return

    setSubmitting(true)
    try {
      if (editingTransaction) {
        const payload: TransactionPayload = {
          date: form.date,
          type: form.type,
          paymentMethod: form.paymentMethod,
          personId,
          category: form.category,
          description: form.description,
          value: Number(form.value),
          competency: editingTransaction.competency,
          creditCard: form.creditCard,
          creditCardId: form.creditCard ? Number(form.creditCard) : undefined,
          bankAccountId: form.bankAccount ? Number(form.bankAccount) : undefined,
          installments: installmentsCount,
          installmentNumber: editingTransaction.installmentNumber,
          totalInstallments: installmentsCount,
          parentPurchase: editingTransaction.parentPurchase,
        }
        await actions.updateTransaction(editingTransaction.id, payload)
      } else if (isCredit && installmentsCount > 1) {
        await actions.createInstallmentGroup({
          date: form.date,
          type: form.type,
          paymentMethod: form.paymentMethod,
          personId,
          category: form.category,
          description: form.description,
          value: Number(form.value),
          creditCardId: Number(form.creditCard),
          totalInstallments: installmentsCount,
        })
      } else {
        const payload: TransactionPayload = {
          date: form.date,
          type: form.type,
          paymentMethod: form.paymentMethod,
          personId,
          category: form.category,
          description: form.description,
          value: Number(form.value),
          competency: '',
          creditCard: isCredit ? form.creditCard : undefined,
          creditCardId: isCredit && form.creditCard ? Number(form.creditCard) : undefined,
          bankAccountId: !isCredit ? Number(form.bankAccount) : undefined,
          installments: installmentsCount,
          installmentNumber: 1,
          totalInstallments: installmentsCount,
        }
        await actions.addTransactions([payload])
      }
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Transaction['type'] })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            <option value="Despesa">Despesa</option>
            <option value="Receita">Receita</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Pagamento
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            <option value="Crédito">Crédito</option>
            <option value="Débito">Débito</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="PIX">PIX</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isCredit ? 'Data da compra' : 'Data do pagamento'}
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          />
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Pessoa
          <select
            value={form.person}
            onChange={(e) => setForm({ ...form, person: e.target.value, bankAccount: '' })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            {persons.filter((p) => p.active).map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
          Categoria
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
          Descrição
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          />
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Valor (R$)
          <input
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          />
        </label>

        {isCredit ? (
          <>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cartão de crédito
              <select
                value={form.creditCard}
                onChange={(e) => setForm({ ...form, creditCard: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Selecione</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={String(card.id)}>
                    {card.name} - {card.owner}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Parcelas
              <input
                type="number"
                min="1"
                value={form.installments}
                onChange={(e) => setForm({ ...form, installments: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </label>
          </>
        ) : (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            Conta bancária
            {form.type === 'Receita' && (
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                Entradas podem ser lançadas em qualquer conta ativa.
              </span>
            )}
            <select
              value={form.bankAccount}
              onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">Selecione a conta</option>
              {filteredBankAccounts.map((account) => (
                <option key={account.id} value={String(account.id)}>
                  {account.name}
                  {form.type === 'Receita' ? ` (${account.owner})` : ''} ({formatBRL(account.currentBalance)})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {preview && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/30 p-4 space-y-2 text-sm">
          {isCredit && preview.invoiceCompetency && (
            <p className="text-blue-900 dark:text-blue-100">
              <strong>1ª fatura:</strong> {preview.invoiceCompetency}
              {preview.dueDay != null && (
                <span className="text-blue-700 dark:text-blue-300 ml-2">Vencimento dia {preview.dueDay}</span>
              )}
            </p>
          )}
          {!isCredit && preview.bankAccountBalanceAfter != null && (
            <p className="text-blue-900 dark:text-blue-100">
              Saldo em <strong>{preview.bankAccountName}</strong>:{' '}
              {formatBRL(preview.bankAccountCurrentBalance ?? 0)} →{' '}
              <strong>{formatBRL(preview.bankAccountBalanceAfter)}</strong>
            </p>
          )}
          {preview.installments.length > 1 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {preview.installments.map((item) => (
                <div key={item.installmentNumber} className="flex justify-between gap-2">
                  <span>
                    <Badge variant="info">{item.installmentNumber}/{preview.installments.length}</Badge>{' '}
                    Fatura {item.competency}
                  </span>
                  <span className="font-medium">{formatBRL(item.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {editingTransaction ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
