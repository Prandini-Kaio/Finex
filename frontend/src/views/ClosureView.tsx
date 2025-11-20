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
    state: { creditCards, closedMonths, transactions: allTransactions },
    actions,
  } = useFinance()

  const isClosed = closedMonths.includes(selectedMonth)

  const cardExpenses = useMemo(() => {
    return creditCards.map((card) => {
      // Filtrar transações de crédito do mês selecionado que pertencem a este cartão
      const expenses = allTransactions
        .filter((transaction) => {
          // Verificar se é do mês selecionado
          if (transaction.competency !== selectedMonth) return false
          
          // Verificar se é despesa e método de pagamento crédito
          if (transaction.type !== 'Despesa' || transaction.paymentMethod !== 'Crédito') return false
          
          // Verificar se pertence ao cartão
          // O backend retorna creditCardId como número, mas também pode vir como creditCard (string)
          const transactionCardId = transaction.creditCardId ?? (transaction.creditCard ? Number(transaction.creditCard) : null)
          
          if (transactionCardId === null || transactionCardId === undefined) return false
          
          // Comparar IDs (ambos são números)
          return transactionCardId === card.id
        })
        .reduce((sum, transaction) => sum + transaction.value, 0)
      
      return {
        ...card,
        expenses,
        available: card.limit - expenses,
        usage: card.limit > 0 ? (expenses / card.limit) * 100 : 0,
      }
    })
  }, [creditCards, allTransactions, selectedMonth])

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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Fechamento mensal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe cartões de crédito e finalize o mês selecionado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MonthYearSelector value={selectedMonth} onChange={onMonthChange} />
          {isClosed ? (
            <button
              onClick={() => actions.reopenMonth(selectedMonth)}
              className="px-4 py-2 bg-warning text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Reabrir mês
            </button>
          ) : (
            <button
              onClick={() => actions.closeMonth(selectedMonth)}
              className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Fechar mês
            </button>
          )}
        </div>
      </div>

      {/* Balanço de Pagamentos - No topo */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Balanço de Pagamentos - {selectedMonth}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Kaio */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Kaio</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Receitas:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">R$ {balanceByPerson.kaio.income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Despesas:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">R$ {balanceByPerson.kaio.expenses.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Saldo:</span>
                <span
                  className={`font-bold ${
                    balanceByPerson.kaio.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  R$ {balanceByPerson.kaio.balance.toFixed(2)}
                </span>
              </div>
              {balanceByPerson.kaio.toPay > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700 dark:text-red-400 font-medium">A pagar:</span>
                    <span className="font-bold text-lg text-red-600 dark:text-red-400">R$ {balanceByPerson.kaio.toPay.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gabriela */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Gabriela</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Receitas:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">R$ {balanceByPerson.gabriela.income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Despesas:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">R$ {balanceByPerson.gabriela.expenses.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Saldo:</span>
                <span
                  className={`font-bold ${
                    balanceByPerson.gabriela.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  R$ {balanceByPerson.gabriela.balance.toFixed(2)}
                </span>
              </div>
              {balanceByPerson.gabriela.toPay > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700 dark:text-red-400 font-medium">A pagar:</span>
                    <span className="font-bold text-lg text-red-600 dark:text-red-400">R$ {balanceByPerson.gabriela.toPay.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo informativo */}
        {(balanceByPerson.kaio.toPay > 0 || balanceByPerson.gabriela.toPay > 0) && (
          <div className="border-2 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">Resumo do Fechamento:</p>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {balanceByPerson.kaio.toPay > 0 && (
                <p>
                  • <strong>Kaio</strong> deve pagar: <strong className="text-red-600 dark:text-red-400">R$ {balanceByPerson.kaio.toPay.toFixed(2)}</strong>
                </p>
              )}
              {balanceByPerson.gabriela.toPay > 0 && (
                <p>
                  • <strong>Gabriela</strong> deve pagar: <strong className="text-red-600 dark:text-red-400">R$ {balanceByPerson.gabriela.toPay.toFixed(2)}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {balanceByPerson.kaio.toPay === 0 && balanceByPerson.gabriela.toPay === 0 && (
          <div className="border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <p className="font-semibold text-green-700 dark:text-green-400">✓ Ambos estão com saldo positivo! Nenhum pagamento necessário.</p>
          </div>
        )}
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Limite Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {totalStats.totalLimit.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gasto Total</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">R$ {totalStats.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Disponível Total</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {totalStats.totalAvailable.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Uso Geral</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalStats.overallUsage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Gráficos */}
      {cardExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico comparativo de uso dos cartões */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Uso dos Cartões</h3>
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Percentual de Uso</h3>
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
            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-100 dark:border-slate-700 space-y-3"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{card.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{card.owner}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  card.usage > 90 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                    : card.usage > 70 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}
              >
                {card.usage.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p>
                Gasto no mês: <strong className="text-red-600 dark:text-red-400">R$ {card.expenses.toFixed(2)}</strong>
              </p>
              <p>
                Limite total: <strong className="text-gray-800 dark:text-gray-100">R$ {card.limit.toFixed(2)}</strong>
              </p>
              <p>
                Disponível: <strong className="text-green-600 dark:text-green-400">R$ {card.available.toFixed(2)}</strong>
              </p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
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

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Meses fechados</h3>
        {closedMonths.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum mês foi fechado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {closedMonths.map((month) => (
              <span key={month} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-sm text-gray-700 dark:text-gray-300">
                {month}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

