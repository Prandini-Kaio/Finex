import { useMemo, useRef } from 'react'
import type { BankAccount, CreditCard, CreditCardInvoiceReceipt, CreditCardInvoiceStatus } from '../../types/finance'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

const formatBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatPaidAt = (paidAt?: string | number[] | null) => {
  if (!paidAt) return '—'
  try {
    let date: Date
    if (typeof paidAt === 'string') {
      date = new Date(paidAt)
    } else if (Array.isArray(paidAt) && paidAt.length >= 3) {
      date = new Date(Number(paidAt[0]), Number(paidAt[1]) - 1, Number(paidAt[2]), Number(paidAt[3]) || 0, Number(paidAt[4]) || 0)
    } else {
      date = new Date(String(paidAt))
    }
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export interface SinglePayModalProps {
  open: boolean
  cardName: string
  ownerName: string
  amount: number
  accounts: BankAccount[]
  selectedAccountId: number | null
  onSelectAccount: (id: number) => void
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}

export const SinglePayModal: React.FC<SinglePayModalProps> = ({
  open,
  cardName,
  ownerName,
  amount,
  accounts,
  selectedAccountId,
  onSelectAccount,
  onConfirm,
  onClose,
  loading,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Pagar fatura"
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={loading || (amount > 0 && !selectedAccountId)}>
          {loading ? 'Processando...' : 'Confirmar pagamento'}
        </Button>
      </>
    }
  >
    <div className="space-y-4 text-sm">
      <p className="text-gray-600 dark:text-gray-300">
        Será gerado um lançamento de <strong>saída</strong> na conta do titular para quitar a fatura.
      </p>
      <div className="rounded-lg border border-gray-200 dark:border-slate-600 p-3 space-y-1">
        <p><span className="text-gray-500">Cartão:</span> <strong>{cardName}</strong></p>
        <p><span className="text-gray-500">Titular:</span> <strong>{ownerName}</strong></p>
        <p><span className="text-gray-500">Valor da fatura:</span> <strong className="text-red-600 dark:text-red-400">{formatBRL(amount)}</strong></p>
      </div>
      {amount > 0 && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Conta para débito
          <select
            value={selectedAccountId ?? ''}
            onChange={(e) => onSelectAccount(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            <option value="">Selecione a conta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — saldo {formatBRL(a.currentBalance)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  </Modal>
)

export interface BulkPayModalProps {
  open: boolean
  cards: CreditCard[]
  invoiceStatuses: Record<number, CreditCardInvoiceStatus>
  bankAccounts: BankAccount[]
  accountByCardId: Record<number, number>
  onSelectAccount: (cardId: number, accountId: number) => void
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}

export const BulkPayModal: React.FC<BulkPayModalProps> = ({
  open,
  cards,
  invoiceStatuses,
  bankAccounts,
  accountByCardId,
  onSelectAccount,
  onConfirm,
  onClose,
  loading,
}) => {
  const pendingCards = useMemo(
    () =>
      cards.filter((c) => {
        const status = invoiceStatuses[c.id]
        return !status?.paid && (status?.invoiceAmount ?? 0) > 0
      }),
    [cards, invoiceStatuses],
  )

  const zeroAmountCount = cards.filter((c) => {
    const status = invoiceStatuses[c.id]
    return !status?.paid && (status?.invoiceAmount ?? 0) <= 0
  }).length

  const allSelected = pendingCards.every((c) => accountByCardId[c.id])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pagar todas as faturas"
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading || (pendingCards.length > 0 && !allSelected)}>
            {loading ? 'Processando...' : 'Confirmar pagamentos'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="text-gray-600 dark:text-gray-300">
          Selecione a conta de débito para cada fatura pendente com valor.
        </p>
        {zeroAmountCount > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {zeroAmountCount} fatura(s) sem gastos serão marcadas como pagas sem lançamento.
          </p>
        )}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {pendingCards.map((card) => {
            const amount = invoiceStatuses[card.id]?.invoiceAmount ?? 0
            const ownerId = invoiceStatuses[card.id]?.ownerId
            const ownerAccounts = bankAccounts.filter(
              (a) => a.active && (ownerId != null ? a.ownerId === ownerId : a.owner === card.owner),
            )
            return (
              <div
                key={card.id}
                className="rounded-lg border border-gray-200 dark:border-slate-600 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{card.name}</p>
                  <p className="text-xs text-gray-500">{card.owner} — {formatBRL(amount)}</p>
                </div>
                <select
                  value={accountByCardId[card.id] ?? ''}
                  onChange={(e) => onSelectAccount(card.id, Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                >
                  <option value="">Conta do titular</option>
                  {ownerAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatBRL(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
          {pendingCards.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhuma fatura pendente com valor a debitar.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

export interface ReceiptModalProps {
  open: boolean
  receipt: CreditCardInvoiceReceipt | null
  onClose: () => void
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ open, receipt, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!printRef.current) return
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=640,height=800')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html><html><head><title>Comprovante — Finex</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 1.25rem; margin-bottom: 8px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; }
        .total { font-size: 1.1rem; font-weight: bold; margin-top: 16px; }
        .footer { margin-top: 24px; font-size: 0.75rem; color: #888; }
      </style></head><body>${content}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  if (!receipt) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comprovante de pagamento"
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handlePrint}>
            Imprimir / PDF
          </Button>
        </>
      }
    >
      <div ref={printRef} className="space-y-3 text-sm">
        <div className="text-center border-b border-gray-200 dark:border-slate-600 pb-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Finex — Comprovante</p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Pagamento de fatura</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-gray-500">Cartão</span><strong>{receipt.creditCardName}</strong></div>
          <div className="flex justify-between"><span className="text-gray-500">Titular</span><strong>{receipt.owner}</strong></div>
          <div className="flex justify-between"><span className="text-gray-500">Fatura (competência)</span><strong>{receipt.referenceMonth}</strong></div>
          <div className="flex justify-between"><span className="text-gray-500">Valor pago</span><strong className="text-red-600 dark:text-red-400">{formatBRL(receipt.invoiceAmount)}</strong></div>
          <div className="flex justify-between"><span className="text-gray-500">Conta debitada</span><strong>{receipt.bankAccountName ?? '—'}</strong></div>
          {receipt.accountBalanceAfterPayment != null && (
            <div className="flex justify-between"><span className="text-gray-500">Saldo após pagamento</span><strong>{formatBRL(receipt.accountBalanceAfterPayment)}</strong></div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">Data do lançamento</span><strong>{receipt.paymentDate ?? '—'}</strong></div>
          <div className="flex justify-between"><span className="text-gray-500">Pago em</span><strong>{formatPaidAt(receipt.paidAt)}</strong></div>
          {receipt.paymentTransactionId && (
            <div className="flex justify-between"><span className="text-gray-500">Lançamento #</span><strong>{receipt.paymentTransactionId}</strong></div>
          )}
          {receipt.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-700">{receipt.description}</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
