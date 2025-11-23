import React, { useMemo } from 'react';
import { PageHeader, Button, Card, LoadingSpinner } from '../components/ui';
import { useAppData, useTransactions } from '../hooks';

interface ClosureViewProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const ClosureView: React.FC<ClosureViewProps> = ({
  selectedMonth,
  onMonthChange,
}) => {
  const { isMonthClosed, addClosedMonth, removeClosedMonth, closedMonths, loading: appLoading } = useAppData();
  const { stats, loading: statsLoading } = useTransactions({ competency: selectedMonth });

  const handleCloseMonth = async () => {
    if (isMonthClosed(selectedMonth)) {
      alert('Este mês já está fechado!');
      return;
    }
    if (window.confirm(`Deseja fechar o mês ${selectedMonth}? Não será possível editar os lançamentos deste mês.`)) {
      const result = await addClosedMonth(selectedMonth);
      if (result.success) {
        alert(`Mês ${selectedMonth} fechado com sucesso!`);
      } else {
        alert(result.error || 'Erro ao fechar mês');
      }
    }
  };

  const handleReopenMonth = async () => {
    if (window.confirm(`Deseja reabrir o mês ${selectedMonth}? Os lançamentos voltarão a ser editáveis.`)) {
      const result = await removeClosedMonth(selectedMonth);
      if (result.success) {
        alert(`Mês ${selectedMonth} reaberto com sucesso!`);
      } else {
        alert(result.error || 'Erro ao reabrir mês');
      }
    }
  };

  const monthIsClosed = isMonthClosed(selectedMonth);

  // Resumo do mês para fechamento
  const monthSummary = useMemo(() => {
    if (!stats) {
      return null;
    }

    const balance = stats.income - stats.expenses;
    const balanceColor = balance >= 0 ? 'text-green-600' : 'text-red-600';
    const balanceLabel = balance >= 0 ? 'Positivo' : 'Negativo';

    return {
      income: stats.income,
      expenses: stats.expenses,
      balance,
      balanceColor,
      balanceLabel,
      byPerson: stats.byPerson,
      byCategory: stats.byCategory,
    };
  }, [stats]);

  if (appLoading || statsLoading) {
    return <LoadingSpinner className="py-20" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fechamento de Mês"
        monthSelector={{
          value: selectedMonth,
          onChange: onMonthChange,
        }}
        actions={
          monthIsClosed ? (
            <Button variant="warning" onClick={handleReopenMonth}>
              Reabrir Mês
            </Button>
          ) : (
            <Button variant="success" onClick={handleCloseMonth}>
              Fechar Mês
            </Button>
          )
        }
      />

      {/* Status do Mês */}
      <Card>
        <div className={`p-4 rounded-lg ${monthIsClosed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Status: {monthIsClosed ? 'Mês Fechado' : 'Mês Aberto'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {monthIsClosed 
                  ? `O mês ${selectedMonth} está fechado. Lançamentos não podem ser editados.`
                  : `O mês ${selectedMonth} está aberto. Lançamentos podem ser editados.`
                }
              </p>
            </div>
            <div className={`text-2xl font-bold ${monthIsClosed ? 'text-green-600' : 'text-yellow-600'}`}>
              {monthIsClosed ? '✓' : '○'}
            </div>
          </div>
        </div>
      </Card>

      {/* Resumo Financeiro do Mês */}
      {monthSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Receitas</h3>
            <p className="text-2xl font-bold text-green-600">
              R$ {monthSummary.income.toFixed(2)}
            </p>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Despesas</h3>
            <p className="text-2xl font-bold text-red-600">
              R$ {monthSummary.expenses.toFixed(2)}
            </p>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Saldo</h3>
            <p className={`text-2xl font-bold ${monthSummary.balanceColor}`}>
              R$ {monthSummary.balance >= 0 ? '+' : ''}{monthSummary.balance.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{monthSummary.balanceLabel}</p>
          </Card>
        </div>
      )}

      {/* Despesas por Pessoa */}
      {monthSummary && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Despesas por Pessoa - {selectedMonth}</h3>
          <div className="space-y-3">
            {Object.entries(monthSummary.byPerson).map(([person, value]) => (
              <div key={person} className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{person}</span>
                <span className="text-lg font-semibold text-gray-800">R$ {Number(value).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Despesas por Categoria */}
      {monthSummary && Object.keys(monthSummary.byCategory).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Despesas por Categoria - {selectedMonth}</h3>
          <div className="space-y-3">
            {Object.entries(monthSummary.byCategory)
              .sort(([, a], [, b]) => Number(b) - Number(a))
              .map(([category, value]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{category}</span>
                  <span className="text-lg font-semibold text-gray-800">R$ {Number(value).toFixed(2)}</span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Lista de Meses Fechados */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Histórico de Fechamentos</h3>
        {closedMonths.length > 0 ? (
          <div className="space-y-2">
            {closedMonths.map((month) => (
              <div 
                key={month} 
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-700">{month}</span>
                <span className="text-sm text-green-600 font-semibold">Fechado</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-400">Nenhum mês foi fechado ainda</p>
        )}
      </Card>
    </div>
  );
};

