import React from 'react';
import { Plus } from 'lucide-react';
import { DashboardProvider, StatsCards, Charts, SavingsReminder, useDashboardContext } from '../contexts/dashboard';
import { PageHeader, LoadingSpinner } from '../components/ui';
import { useAppData } from '../hooks';

interface DashboardViewProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onAddTransaction: () => void;
  onViewSavings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedMonth,
  onMonthChange,
  onAddTransaction,
  onViewSavings,
}) => {
  const { isMonthClosed } = useAppData();

  return (
    <DashboardProvider selectedMonth={selectedMonth}>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          monthSelector={{
            value: selectedMonth,
            onChange: onMonthChange,
          }}
          showAddButton
          addButtonLabel="Adicionar Lançamento"
          onAddClick={onAddTransaction}
          addButtonIcon={Plus}
        />

        {isMonthClosed(selectedMonth) && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            ✓ Mês {selectedMonth} já está fechado
          </div>
        )}

        <DashboardContent onViewSavings={onViewSavings} />
      </div>
    </DashboardProvider>
  );
};

const DashboardContent: React.FC<{ onViewSavings: () => void }> = ({ onViewSavings }) => {
  const { stats, savingsGoals, totalSaved, savingsPercentage, loading } = useDashboardContext();

  if (loading) {
    return <LoadingSpinner className="py-20" />;
  }

  return (
    <>
      <SavingsReminder 
        stats={stats} 
        savingsGoalsCount={savingsGoals.length}
        onViewSavings={onViewSavings}
      />
      
      <StatsCards 
        stats={stats} 
        totalSaved={totalSaved} 
        savingsPercentage={savingsPercentage} 
      />
      
      <Charts stats={stats} savingsTrend={[]} />
    </>
  );
};

