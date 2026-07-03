import { useMemo } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FinanceProvider, useFinance } from './context/FinanceContext'
import { FilterProvider, useFilters } from './context/FilterContext'
import { filterTransactions } from './utils/finance'
import type { Transaction } from './types/finance'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardView } from './views/DashboardView'
import { TransactionsView } from './views/TransactionsView'
import { RecurringTransactionsView } from './views/RecurringTransactionsView'
import { ClosureView } from './views/ClosureView'
import { BudgetHealthView } from './views/BudgetHealthView'
import { SavingsView } from './views/SavingsView'
import { InvestmentsView } from './views/InvestmentsView'
import { SettingsView } from './views/SettingsView'
import { BankAccountsView } from './views/BankAccountsView'
import { FilterBar } from './components/filters/FilterBar'
import { MonthYearSelector } from './components/MonthYearSelector'

const GlobalPeriodBar: React.FC = () => {
  const { selectedMonth, setSelectedMonth } = useFilters()
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Competência:</span>
      <MonthYearSelector value={selectedMonth} onChange={setSelectedMonth} />
    </div>
  )
}

function useFilteredTransactions(): Transaction[] {
  const { state } = useFinance()
  const { filters, selectedMonth } = useFilters()
  return useMemo(
    () => filterTransactions(state.transactions, selectedMonth, filters),
    [state.transactions, selectedMonth, filters],
  )
}

const FilteredViewWrapper: React.FC<{
  children: (transactions: Transaction[]) => React.ReactNode
  showFilters?: boolean
}> = ({ children, showFilters = false }) => {
  const filtered = useFilteredTransactions()
  return (
    <div className="space-y-4">
      <GlobalPeriodBar />
      {showFilters && <FilterBar />}
      {children(filtered)}
    </div>
  )
}

const DashboardRoute: React.FC = () => {
  const { selectedMonth, setSelectedMonth } = useFilters()
  const filtered = useFilteredTransactions()
  return (
    <div className="space-y-4">
      <GlobalPeriodBar />
      <FilterBar visibleFilters={['persons']} />
      <DashboardView
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        transactions={filtered}
      />
    </div>
  )
}

const ClosureRoute: React.FC = () => {
  const { selectedMonth, setSelectedMonth } = useFilters()
  const filtered = useFilteredTransactions()
  return (
    <FilteredViewWrapper>
      {() => (
        <ClosureView
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          transactions={filtered}
        />
      )}
    </FilteredViewWrapper>
  )
}

const BudgetRoute: React.FC = () => {
  const { selectedMonth, setSelectedMonth } = useFilters()
  const filtered = useFilteredTransactions()
  return (
    <FilteredViewWrapper>
      {() => (
        <BudgetHealthView
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          transactions={filtered}
        />
      )}
    </FilteredViewWrapper>
  )
}

const RecurringRoute: React.FC = () => {
  const { selectedMonth, setSelectedMonth } = useFilters()
  return (
    <>
      <GlobalPeriodBar />
      <RecurringTransactionsView selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
    </>
  )
}

const AppContent: React.FC = () => {
  const { loading, error } = useFinance()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500">
        Carregando dados financeiros...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 space-y-2">
        <p className="text-lg font-semibold">Não foi possível carregar o dashboard.</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/lancamentos" element={<TransactionsView />} />
        <Route path="/fixos" element={<RecurringRoute />} />
        <Route path="/fechamento" element={<ClosureRoute />} />
        <Route path="/orcamento" element={<BudgetRoute />} />
        <Route path="/poupanca" element={<SavingsView />} />
        <Route path="/investimentos" element={<InvestmentsView />} />
        <Route path="/contas" element={<BankAccountsView />} />
        <Route path="/configuracoes" element={<SettingsView />} />
      </Route>
    </Routes>
  )
}

const App = () => (
  <FinanceProvider>
    <FilterProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </FilterProvider>
  </FinanceProvider>
)

export default App
