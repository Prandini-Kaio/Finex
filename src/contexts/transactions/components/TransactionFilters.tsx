import React from 'react';
import type { TransactionFilters } from '../../../services/api';
import { MonthSelector } from '../../../components/ui';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  categories: string[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const TransactionFiltersComponent: React.FC<TransactionFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  selectedMonth,
  onMonthChange
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa</label>
          <select
            value={filters.person || 'Todos'}
            onChange={(e) => onFiltersChange({...filters, person: e.target.value === 'Todos' ? undefined : e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option>Todos</option>
            <option>Kaio</option>
            <option>Gabriela</option>
            <option>Ambos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select
            value={filters.category || 'Todas'}
            onChange={(e) => onFiltersChange({...filters, category: e.target.value === 'Todas' ? undefined : e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option>Todas</option>
            {categories.map(cat => <option key={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
          <select
            value={filters.paymentType || 'Todos'}
            onChange={(e) => onFiltersChange({...filters, paymentType: e.target.value === 'Todos' ? undefined : e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option>Todos</option>
            <option>Crédito</option>
            <option>Débito</option>
            <option>Dinheiro</option>
            <option>PIX</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Competência</label>
          <MonthSelector
            value={selectedMonth}
            onChange={onMonthChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
