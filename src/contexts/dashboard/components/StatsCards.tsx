import React from 'react';
import type { FinancialStats } from '../../../types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  stats: FinancialStats | null;
  totalSaved: number;
  savingsPercentage: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  totalSaved,
  savingsPercentage
}) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
                <p className="text-gray-600 text-sm">Total de Despesas</p>
            <p className="text-2xl font-bold text-red-600">R$ {stats.expenses.toFixed(2)}</p>
          </div>
          <TrendingDown className="text-red-500" size={32} />
        </div>
      </div>

      <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
                <p className="text-gray-600 text-sm">Total de Receitas</p>
            <p className="text-2xl font-bold text-green-600">R$ {stats.income.toFixed(2)}</p>
          </div>
          <TrendingUp className="text-green-500" size={32} />
        </div>
      </div>

      <div className={`${
        stats.balance >= 0 
          ? 'bg-blue-50 border-blue-500' 
          : 'bg-orange-50 border-orange-500'
      } border-l-4 p-6 rounded-lg`}>
        <div className="flex items-center justify-between">
          <div>
                <p className="text-gray-600 text-sm">Saldo do Mês</p>
            <p className={`text-2xl font-bold ${
              stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              R$ {stats.balance.toFixed(2)}
            </p>
          </div>
          <DollarSign className={stats.balance >= 0 ? 'text-blue-500' : 'text-orange-500'} size={32} />
        </div>
      </div>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
                <p className="text-gray-600 text-sm">Total Poupado</p>
            <p className="text-2xl font-bold text-purple-600">R$ {totalSaved.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{savingsPercentage.toFixed(1)}% da meta</p>
          </div>
          <div className="text-purple-500 text-3xl">🏦</div>
        </div>
      </div>
    </div>
  );
};
