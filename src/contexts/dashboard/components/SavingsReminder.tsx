import React from 'react';
import type { FinancialStats } from '../../../types';

interface SavingsReminderProps {
  stats: FinancialStats | null;
  savingsGoalsCount: number;
  onViewSavings: () => void;
}

export const SavingsReminder: React.FC<SavingsReminderProps> = ({
  stats,
  savingsGoalsCount,
  onViewSavings
}) => {
  if (!stats || stats.income <= 0 || savingsGoalsCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2">💡 Lembre-se de Poupar!</h3>
          <p className="text-lg opacity-90">
            Você teve R$ {stats.income.toFixed(2)} de receita este mês. 
            Que tal guardar pelo menos 10%? (R$ {(stats.income * 0.1).toFixed(2)})
          </p>
          <p className="text-sm mt-2 opacity-80">
            Você tem {savingsGoalsCount} objetivo(s) em andamento 🎯
          </p>
        </div>
        <button
          onClick={onViewSavings}
          className="bg-white text-yellow-600 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-50"
        >
          Ver Objetivos
        </button>
      </div>
    </div>
  );
};
