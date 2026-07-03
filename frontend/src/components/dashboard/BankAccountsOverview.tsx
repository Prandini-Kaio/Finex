import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { formatBRL } from '../../utils/formatBRL'
import { Landmark } from 'lucide-react'
import { Link } from 'react-router-dom'

export const BankAccountsOverview: React.FC = () => {
  const {
    state: { bankAccounts },
  } = useFinance()

  if (bankAccounts.length === 0) return null

  const total = bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0)

  return (
    <Card title="Contas bancárias">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total: <span className="font-bold text-gray-800 dark:text-gray-100">{formatBRL(total)}</span>
        </p>
        <Link to="/contas" className="text-sm text-primary hover:underline flex items-center gap-1">
          <Landmark size={14} /> Gerenciar
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {bankAccounts.slice(0, 6).map((account) => (
          <div
            key={account.id}
            className="rounded-lg border border-gray-200 dark:border-slate-600 p-3 bg-gray-50/50 dark:bg-slate-700/30"
          >
            <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{account.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{account.owner}</p>
            <p className="text-lg font-bold text-primary mt-1">{formatBRL(account.currentBalance)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
