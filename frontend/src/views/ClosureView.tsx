import { useMemo } from 'react'
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
import type { Transaction } from '../types/finance'
import { MonthYearSelector } from '../components/MonthYearSelector'

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

  // Gráfico comparativo de uso dos cartões
  const cardUsageChart = useMemo(() => {
    return cardExpenses.map((card) => ({
      name: card.name.length > 10 ? card.name.substring(0, 10) + '...' : card.name,
      usado: card.expenses,
      disponivel: card.available,
      limite: card.limit,
      uso: Math.min(card.usage, 100),
    }))
  }, [cardExpenses])

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const totalLimit = cardExpenses.reduce((sum, card) => sum + card.limit, 0)
    const totalExpenses = cardExpenses.reduce((sum, card) => sum + card.expenses, 0)
    const totalAvailable = cardExpenses.reduce((sum, card) => sum + card.available, 0)
    return {
      totalLimit,
      totalExpenses,
      totalAvailable,
      overallUsage: totalLimit > 0 ? (totalExpenses / totalLimit) * 100 : 0,
    }
  }, [cardExpenses])

  // Balanço de pagamentos entre pessoas
  const balanceByPerson = useMemo(() => {
    // Despesas de Kaio (incluindo metade das despesas "Ambos")
    const kaioExpenses = transactions
      .filter((t) => t.type === 'Despesa' && (t.person === 'Kaio' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    // Receitas de Kaio (incluindo metade das receitas "Ambos")
    const kaioIncome = transactions
      .filter((t) => t.type === 'Receita' && (t.person === 'Kaio' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    // Despesas de Gabriela (incluindo metade das despesas "Ambos")
    const gabrielaExpenses = transactions
      .filter((t) => t.type === 'Despesa' && (t.person === 'Gabriela' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    // Receitas de Gabriela (incluindo metade das receitas "Ambos")
    const gabrielaIncome = transactions
      .filter((t) => t.type === 'Receita' && (t.person === 'Gabriela' || t.person === 'Ambos'))
      .reduce((sum, t) => sum + (t.person === 'Ambos' ? t.value / 2 : t.value), 0)

    const kaioBalance = kaioIncome - kaioExpenses
    const gabrielaBalance = gabrielaIncome - gabrielaExpenses

    // Quanto cada um deve pagar (apenas informativo, sem calcular transferências)
    const kaioToPay = kaioBalance < 0 ? Math.abs(kaioBalance) : 0
    const gabrielaToPay = gabrielaBalance < 0 ? Math.abs(gabrielaBalance) : 0

    return {
      kaio: {
        expenses: kaioExpenses,
        income: kaioIncome,
        balance: kaioBalance,
        toPay: kaioToPay,
      },
      gabriela: {
        expenses: gabrielaExpenses,
        income: gabrielaIncome,
        balance: gabrielaBalance,
        toPay: gabrielaToPay,
      },
    }
  }, [transactions])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Fechamento mensal</h1>
          <p className="text-sm text-gray-500">Acompanhe cartões de crédito e finalize o mês selecionado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MonthYearSelector value={selectedMonth} onChange={onMonthChange} />
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

      {/* Balanço de Pagamentos - No topo */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Balanço de Pagamentos - {selectedMonth}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Kaio */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Kaio</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Receitas:</span>
                <span className="font-semibold text-green-600">R$ {balanceByPerson.kaio.income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Despesas:</span>
                <span className="font-semibold text-red-600">R$ {balanceByPerson.kaio.expenses.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-gray-700 font-medium">Saldo:</span>
                <span
                  className={`font-bold ${
                    balanceByPerson.kaio.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  R$ {balanceByPerson.kaio.balance.toFixed(2)}
                </span>
              </div>
              {balanceByPerson.kaio.toPay > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700 font-medium">A pagar:</span>
                    <span className="font-bold text-lg text-red-600">R$ {balanceByPerson.kaio.toPay.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gabriela */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Gabriela</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Receitas:</span>
                <span className="font-semibold text-green-600">R$ {balanceByPerson.gabriela.income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Despesas:</span>
                <span className="font-semibold text-red-600">R$ {balanceByPerson.gabriela.expenses.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-gray-700 font-medium">Saldo:</span>
                <span
                  className={`font-bold ${
                    balanceByPerson.gabriela.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  R$ {balanceByPerson.gabriela.balance.toFixed(2)}
                </span>
              </div>
              {balanceByPerson.gabriela.toPay > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700 font-medium">A pagar:</span>
                    <span className="font-bold text-lg text-red-600">R$ {balanceByPerson.gabriela.toPay.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo informativo */}
        {(balanceByPerson.kaio.toPay > 0 || balanceByPerson.gabriela.toPay > 0) && (
          <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
            <p className="font-semibold text-lg text-gray-800 mb-2">Resumo do Fechamento:</p>
            <div className="space-y-1 text-sm text-gray-700">
              {balanceByPerson.kaio.toPay > 0 && (
                <p>
                  • <strong>Kaio</strong> deve pagar: <strong className="text-red-600">R$ {balanceByPerson.kaio.toPay.toFixed(2)}</strong>
                </p>
              )}
              {balanceByPerson.gabriela.toPay > 0 && (
                <p>
                  • <strong>Gabriela</strong> deve pagar: <strong className="text-red-600">R$ {balanceByPerson.gabriela.toPay.toFixed(2)}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {balanceByPerson.kaio.toPay === 0 && balanceByPerson.gabriela.toPay === 0 && (
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
            <p className="font-semibold text-green-700">✓ Ambos estão com saldo positivo! Nenhum pagamento necessário.</p>
          </div>
        )}
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Limite Total</p>
          <p className="text-2xl font-bold text-blue-600">R$ {totalStats.totalLimit.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Gasto Total</p>
          <p className="text-2xl font-bold text-red-600">R$ {totalStats.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Disponível Total</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalStats.totalAvailable.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Uso Geral</p>
          <p className="text-2xl font-bold text-purple-600">{totalStats.overallUsage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Gráficos */}
      {cardExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico comparativo de uso dos cartões */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Uso dos Cartões</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardUsageChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'uso') return `${value.toFixed(1)}%`
                    return `R$ ${value.toFixed(2)}`
                  }}
                />
                <Legend />
                <Bar dataKey="usado" fill="#ef4444" name="Usado" />
                <Bar dataKey="disponivel" fill="#10b981" name="Disponível" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de percentual de uso */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Percentual de Uso</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardUsageChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="uso" fill="#8b5cf6" name="Uso (%)">
                  {cardUsageChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.uso > 90 ? '#ef4444' : entry.uso > 70 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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

