import React from 'react';
import { Plus } from 'lucide-react';
import {
  TransactionProvider,
  TransactionFormModal,
  TransactionList,
  TransactionFiltersComponent,
  useTransactionContext,
} from '../contexts/transactions';
import { PageHeader, Card } from '../components/ui';
import { useCategories, useAppData } from '../hooks';
import type { TransactionFilters } from '../services/api';

interface TransactionsViewProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onAddTransaction: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  filters,
  onFiltersChange,
  selectedMonth,
  onMonthChange,
  onAddTransaction,
}) => {
  const { categories } = useCategories();
  const { isMonthClosed } = useAppData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lançamentos"
        showAddButton
        addButtonLabel="Adicionar"
        onAddClick={onAddTransaction}
        addButtonIcon={Plus}
      />

      <TransactionFiltersComponent
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
      />

      <TransactionProvider 
        filters={{...filters, competency: selectedMonth} as any}
        includeRelatedTransactions={true}
      >
        <TransactionContent isMonthClosed={isMonthClosed(selectedMonth)} />
      </TransactionProvider>
    </div>
  );
};

const TransactionContent: React.FC<{ isMonthClosed: boolean }> = ({ isMonthClosed }) => {
  const { transactions, deleteTransaction } = useTransactionContext();
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Deseja realmente excluir esta transação?')) {
      await deleteTransaction(id);
    }
  };

  return (
    <Card>
      <TransactionList 
        transactions={transactions}
        onDelete={handleDelete}
        isMonthClosed={isMonthClosed}
      />
    </Card>
  );
};

