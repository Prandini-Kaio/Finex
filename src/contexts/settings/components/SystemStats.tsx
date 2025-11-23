import React from 'react';
import { useSettingsContext } from '../SettingsContext';
import { useTransactions, useBudgets, useSavingsGoals } from '../../../hooks';
import { BarChart3, Database, Calendar, Tag, Target, CreditCard } from 'lucide-react';

export const SystemStats: React.FC = () => {
  const { creditCards, categories, closedMonths } = useSettingsContext();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const { savingsGoals } = useSavingsGoals();

  const stats = [
    {
      icon: BarChart3,
      label: 'Total de Transações',
      value: transactions.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Calendar,
      label: 'Meses Fechados',
      value: closedMonths.length,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Tag,
      label: 'Categorias Cadastradas',
      value: categories.length,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Target,
      label: 'Orçamentos Definidos',
      value: budgets.length,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: CreditCard,
      label: 'Cartões Cadastrados',
      value: creditCards.length,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      icon: Database,
      label: 'Objetivos de Poupança',
      value: savingsGoals.length,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
        <Database size={20} />
        Dados do Sistema
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className={`${stat.bgColor} p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <IconComponent className={`${stat.color} opacity-60`} size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Resumo Geral</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total de dados:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {transactions.length + budgets.length + savingsGoals.length + creditCards.length + categories.length + closedMonths.length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Última atualização:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
