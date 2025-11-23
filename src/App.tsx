import React, { useState } from 'react';
import { Navigation } from './components/ui';
import {
  DashboardView,
  TransactionsView,
  ClosureView,
  BudgetView,
  SavingsView,
  SettingsView,
} from './views';
import {
  TransactionProvider,
  TransactionFormModal,
} from './contexts/transactions';
import {
  BudgetProvider,
  BudgetFormModal,
} from './contexts/budgets';
import {
  SavingsProvider,
  SavingsGoalFormModal,
} from './contexts/savings';
import {
  SettingsProvider,
  CreditCardFormModal,
} from './contexts/settings';

type ViewType = 'dashboard' | 'transactions' | 'closure' | 'budget' | 'savings' | 'settings';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('01/2025');
  const [filters, setFilters] = useState({
    person: 'Todos',
    category: 'Todas',
    paymentType: 'Todos'
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onAddTransaction={() => setShowTransactionModal(true)}
            onViewSavings={() => setActiveView('savings')}
          />
        );
      case 'transactions':
        return (
          <TransactionsView
            filters={filters}
            onFiltersChange={(newFilters) => setFilters(newFilters as any)}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onAddTransaction={() => setShowTransactionModal(true)}
          />
        );
      case 'closure':
        return (
          <ClosureView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        );
      case 'budget':
        return (
          <BudgetView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onAddBudget={() => setShowBudgetModal(true)}
          />
        );
      case 'savings':
        return (
          <SavingsView
            onAddSavingsGoal={() => setShowSavingsModal(true)}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onAddTransaction={() => setShowTransactionModal(true)}
            onViewSavings={() => setActiveView('savings')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeView={activeView} onViewChange={setActiveView} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderView()}
      </main>

      {/* Modais */}
      <TransactionProvider filters={{}}>
        <TransactionFormModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
        />
      </TransactionProvider>

      <BudgetProvider filters={{}}>
        <BudgetFormModal
          isOpen={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
        />
      </BudgetProvider>

      <SavingsProvider>
        <SavingsGoalFormModal
          isOpen={showSavingsModal}
          onClose={() => setShowSavingsModal(false)}
        />
      </SavingsProvider>

      <SettingsProvider>
        <CreditCardFormModal
          isOpen={showCreditCardModal}
          onClose={() => setShowCreditCardModal(false)}
        />
      </SettingsProvider>
    </div>
  );
};

export default App;
