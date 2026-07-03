import { DollarSign, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react'
import { formatBRL } from '../../utils/formatBRL'

interface SummaryCardsProps {
  income: number
  expenses: number
  balance: number
  savingsPercent: number
}

export const DashboardSummaryCards: React.FC<SummaryCardsProps> = ({
  income,
  expenses,
  balance,
  savingsPercent,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
        <TrendingUp size={18} />
        <span className="text-sm font-medium">Receitas</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatBRL(income)}</p>
    </div>
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
        <TrendingDown size={18} />
        <span className="text-sm font-medium">Despesas</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatBRL(expenses)}</p>
    </div>
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
        <DollarSign size={18} />
        <span className="text-sm font-medium">Saldo</span>
      </div>
      <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {formatBRL(balance)}
      </p>
    </div>
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
        <PiggyBank size={18} />
        <span className="text-sm font-medium">Poupança vs meta</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{savingsPercent.toFixed(1)}%</p>
    </div>
  </div>
)
