import { useEffect, useMemo, useState } from 'react'
import { FinanceProvider, useFinance } from './context/FinanceContext'
import { DEFAULT_FILTERS, filterTransactions, getCurrentCompetency } from './utils/finance'
import type { FinanceFilters } from './types/finance'
import { DashboardView } from './views/DashboardView'
import { TransactionsView } from './views/TransactionsView'
import { RecurringTransactionsView } from './views/RecurringTransactionsView'
import { ClosureView } from './views/ClosureView'
import { BudgetHealthView } from './views/BudgetHealthView'
import { SavingsView } from './views/SavingsView'
import { SettingsView } from './views/SettingsView'
import { ThemeToggle } from './components/ThemeToggle'

type FinanceView = 'dashboard' | 'transactions' | 'recurring' | 'closure' | 'budget' | 'savings' | 'settings'

const VIEW_LABELS: Record<FinanceView, string> = {
  dashboard: 'Dashboard',
  transactions: 'Lançamentos',
  recurring: 'Lançamentos Fixos',
  closure: 'Fechamento',
  budget: 'Planejamento',
  savings: 'Poupança',
  settings: 'Configurações',
}

const ViewContainer: React.FC = () => {
  const { state, loading, error, actions } = useFinance()

  const [activeView, setActiveView] = useState<FinanceView>('dashboard')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentCompetency())
  const [filters, setFilters] = useState<FinanceFilters>(DEFAULT_FILTERS)
  const [lastView, setLastView] = useState<FinanceView>('dashboard')

  // Recarrega dados apenas quando muda de aba (com delay para evitar conflitos)
  useEffect(() => {
    if (activeView !== lastView) {
      setLastView(activeView)
      // Delay pequeno para garantir que operações em andamento terminem
      const timeout = setTimeout(() => {
        actions.refresh()
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [activeView, lastView, actions])

  const filteredTransactions = useMemo(
    () => filterTransactions(state.transactions, selectedMonth, filters),
    [state.transactions, selectedMonth, filters],
  )

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            transactions={filteredTransactions}
          />
        )
      case 'transactions':
        return (
          <TransactionsView
            filters={filters}
            onFiltersChange={setFilters}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            transactions={filteredTransactions}
          />
        )
      case 'recurring':
        return (
          <RecurringTransactionsView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )
      case 'closure':
        return (
          <ClosureView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            transactions={filteredTransactions}
          />
        )
      case 'budget':
        return (
          <BudgetHealthView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            transactions={filteredTransactions}
          />
        )
      case 'savings':
        return <SavingsView />
      case 'settings':
        return <SettingsView />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
        Carregando dados financeiros...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 space-y-2">
        <p className="text-lg font-semibold">Não foi possível carregar o dashboard.</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(VIEW_LABELS) as FinanceView[]).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeView === view
                    ? 'bg-primary text-white dark:bg-primary dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {VIEW_LABELS[view]}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{renderView()}</main>
    </div>
  )
}

const App = () => (
  <FinanceProvider>
    <ViewContainer />
  </FinanceProvider>
)

export default App



