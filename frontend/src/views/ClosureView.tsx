import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import type { Transaction } from '../types/finance'

interface ClosureViewProps {
  selectedMonth: string
  onMonthChange: (value: string) => void
  transactions: Transaction[]
}

export const ClosureView: React.FC<ClosureViewProps> = ({ selectedMonth, onMonthChange, transactions }) => {
  const {
    state: { creditCards, closedMonths },
    actions,
  } = useFinance()

  const isClosed = closedMonths.includes(selectedMonth)

  const cardExpenses = useMemo(() => {
    return creditCards.map((card) => {
      const expenses = transactions
        .filter(
          (transaction) =>
            transaction.paymentMethod === 'Crédito' && String(card.id) === transaction.creditCard && transaction.type === 'Despesa',
        )
        .reduce((sum, transaction) => sum + transaction.value, 0)
      return {
        ...card,
        expenses,
        available: card.limit - expenses,
        usage: card.limit > 0 ? (expenses / card.limit) * 100 : 0,
      }
    })
  }, [creditCards, transactions])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Fechamento mensal</h1>
          <p className="text-sm text-gray-500">Acompanhe cartões de crédito e finalize o mês selecionado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="px-3 py-2 border rounded-lg"
            placeholder="MM/AAAA"
          />
          {isClosed ? (
            <button
              onClick={() => actions.reopenMonth(selectedMonth)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Reabrir mês
            </button>
          ) : (
            <button
              onClick={() => actions.closeMonth(selectedMonth)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Fechar mês
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cardExpenses.map((card) => (
          <div
            key={card.id}
            className="bg-white p-4 rounded-lg shadow border border-gray-100 space-y-3"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">{card.name}</p>
                <p className="text-xs text-gray-400">{card.owner}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  card.usage > 90 ? 'bg-red-100 text-red-700' : card.usage > 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {card.usage.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Gasto no mês: <strong className="text-red-600">R$ {card.expenses.toFixed(2)}</strong>
              </p>
              <p>
                Limite total: <strong>R$ {card.limit.toFixed(2)}</strong>
              </p>
              <p>
                Disponível: <strong className="text-green-600">R$ {card.available.toFixed(2)}</strong>
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  card.usage > 90 ? 'bg-red-500' : card.usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(card.usage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Meses fechados</h3>
        {closedMonths.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum mês foi fechado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {closedMonths.map((month) => (
              <span key={month} className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                {month}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

