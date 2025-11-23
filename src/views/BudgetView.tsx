import React from 'react';
import { Plus } from 'lucide-react';
import { BudgetProvider, useBudgetContext, BudgetTrendsCharts } from '../contexts/budgets';
import { PageHeader, LoadingSpinner, Card } from '../components/ui';
import { getPersonColorClasses } from '../utils/colors';

interface BudgetViewProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onAddBudget: () => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  selectedMonth,
  onMonthChange,
  onAddBudget,
}) => {
  return (
    <BudgetProvider filters={{ competency: selectedMonth }}>
      <div className="space-y-6">
        <PageHeader
          title="Planejamento & Saúde Financeira"
          monthSelector={{
            value: selectedMonth,
            onChange: onMonthChange,
          }}
          showAddButton
          addButtonLabel="Definir Orçamento"
          onAddClick={onAddBudget}
          addButtonIcon={Plus}
          addButtonVariant="success"
        />

        <BudgetContent selectedMonth={selectedMonth} />
      </div>
    </BudgetProvider>
  );
};

const BudgetContent: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const { budgetData, budgets, loading } = useBudgetContext();
  
  if (loading) {
    return <LoadingSpinner className="py-20" />;
  }

  return (
    <div className="space-y-6">
      {/* Tabela de Orçamentos do Mês */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Orçamentos do Mês - {selectedMonth}</h3>
        {budgetData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoria</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pessoa</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Orçado</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Gasto Real</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Diferença</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">% Usado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {budgetData.map(budget => (
                  <tr key={budget.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{budget.category}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getPersonColorClasses(budget.person)}`}>
                        {budget.person}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">R$ {budget.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">R$ {budget.spent.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${budget.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {budget.difference >= 0 ? '+' : ''}R$ {budget.difference.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{budget.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-400">Nenhum orçamento definido para este mês</p>
        )}
      </Card>

      {/* Gráficos de Tendência e Evolução */}
      <BudgetTrendsCharts selectedMonth={selectedMonth} budgets={budgets} />
    </div>
  );
};

