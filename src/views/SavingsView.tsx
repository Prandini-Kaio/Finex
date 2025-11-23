import React, { useMemo, useState } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { SavingsProvider, useSavingsContext, SavingsCharts, DepositFormModal } from '../contexts/savings';
import { PageHeader, LoadingSpinner, Card, EmptyState, Button } from '../components/ui';
import { getPersonColorClasses } from '../utils/colors';
import type { SavingsGoal } from '../types';

interface SavingsViewProps {
  onAddSavingsGoal: () => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  onAddSavingsGoal,
}) => {
  return (
    <SavingsProvider>
      <div className="space-y-6">
        <PageHeader
          title="💰 Poupança & Investimentos"
          showAddButton
          addButtonLabel="Novo Objetivo"
          onAddClick={onAddSavingsGoal}
          addButtonIcon={Plus}
          addButtonVariant="success"
        />

        <SavingsContent onAddSavingsGoal={onAddSavingsGoal} />
      </div>
    </SavingsProvider>
  );
};

const SavingsContent: React.FC<{ onAddSavingsGoal: () => void }> = ({ onAddSavingsGoal }) => {
  const { savingsGoals, loading } = useSavingsContext();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  
  const totalSaved = useMemo(() => 
    savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0), 
    [savingsGoals]
  );
  
  const savingsTrend = useMemo(() => {
    const last6Months: Array<{ month: string; saved: number }> = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      let monthSavings = 0;
      savingsGoals.forEach(goal => {
        const monthDeposits = goal.deposits.filter(d => {
          const depositDate = new Date(d.date);
          const depositMonth = `${String(depositDate.getMonth() + 1).padStart(2, '0')}/${depositDate.getFullYear()}`;
          return depositMonth === monthKey;
        });
        monthSavings += monthDeposits.reduce((sum, d) => sum + d.amount, 0);
      });
      
      last6Months.push({
        month: monthKey,
        saved: monthSavings
      });
    }
    
    return last6Months;
  }, [savingsGoals]);

  if (loading) {
    return <LoadingSpinner className="py-20" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Guardado</h3>
          <p className="text-3xl font-bold">R$ {totalSaved.toFixed(2)}</p>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Média Mensal</h3>
          <p className="text-3xl font-bold">R$ {(savingsTrend.reduce((sum, m) => sum + m.saved, 0) / savingsTrend.length || 0).toFixed(2)}</p>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-2">Objetivos Ativos</h3>
          <p className="text-3xl font-bold">{savingsGoals.filter(g => g.currentAmount < g.targetAmount).length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savingsGoals.map(goal => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100;
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          
          return (
            <Card key={goal.id} className={`border-t-4 ${isCompleted ? 'border-green-600' : 'border-green-500'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-800">{goal.name}</h3>
                    {isCompleted && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        Concluído
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                  <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${getPersonColorClasses(goal.owner)}`}>
                    {goal.owner}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso</span>
                  <span className="font-semibold">{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${isCompleted ? 'bg-green-600' : 'bg-green-500'}`}
                    style={{
                      width: `${Math.min(percentage, 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm mt-1 text-gray-600">
                  <span>R$ {goal.currentAmount.toFixed(2)}</span>
                  <span>R$ {goal.targetAmount.toFixed(2)}</span>
                </div>
              </div>

              {goal.deadline && (
                <div className="mb-4 text-sm text-gray-600">
                  <p>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
                </div>
              )}

              {/* Botão de Depósito */}
              {!isCompleted && (
                <Button
                  variant="success"
                  size="sm"
                  icon={DollarSign}
                  onClick={() => {
                    setSelectedGoal(goal);
                    setShowDepositModal(true);
                  }}
                  className="w-full"
                >
                  Adicionar Depósito
                </Button>
              )}

              {/* Histórico de Depósitos */}
              {goal.deposits.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Últimos Depósitos:</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {goal.deposits.slice(-3).reverse().map(deposit => (
                      <div key={deposit.id} className="flex justify-between text-xs text-gray-600">
                        <span>{new Date(deposit.date).toLocaleDateString('pt-BR')}</span>
                        <span className="font-semibold text-green-600">+ R$ {deposit.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Gráficos de Poupança */}
      <SavingsCharts savingsGoals={savingsGoals} />

      {savingsGoals.length === 0 && (
        <EmptyState
          icon="🎯"
          title="Crie seu primeiro objetivo!"
          description="Defina metas de poupança e acompanhe seu progresso"
          actionLabel="Começar Agora"
          onAction={onAddSavingsGoal}
          actionVariant="success"
        />
      )}

      {/* Modal de Depósito */}
      <DepositFormModal
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
      />
    </div>
  );
};

