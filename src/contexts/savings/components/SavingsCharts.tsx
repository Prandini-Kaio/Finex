import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { Card } from '../../../components/ui';
import { colors } from '../../../design-system';
import type { SavingsGoal } from '../../../types';

interface SavingsChartsProps {
  savingsGoals: SavingsGoal[];
}

type ViewMode = 'progress' | 'trend' | 'distribution';
type ChartType = 'line' | 'bar';

export const SavingsCharts: React.FC<SavingsChartsProps> = ({
  savingsGoals,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('progress');
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Dados de progresso dos objetivos
  const progressData = useMemo(() => {
    return savingsGoals.map(goal => ({
      name: goal.name.length > 15 ? goal.name.substring(0, 15) + '...' : goal.name,
      Atual: goal.currentAmount,
      Meta: goal.targetAmount,
      Restante: Math.max(0, goal.targetAmount - goal.currentAmount),
      Porcentagem: (goal.currentAmount / goal.targetAmount) * 100,
    }));
  }, [savingsGoals]);

  // Dados de tendência de depósitos (últimos 12 meses)
  const trendData = useMemo(() => {
    const months: Array<{ month: string; saved: number; goals: Record<string, number> }> = [];
    const currentDate = new Date();
    
    // Gera últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      let monthTotal = 0;
      const goalsByMonth: Record<string, number> = {};
      
      savingsGoals.forEach(goal => {
        const monthDeposits = goal.deposits.filter(d => {
          const depositDate = new Date(d.date);
          const depositMonth = `${String(depositDate.getMonth() + 1).padStart(2, '0')}/${depositDate.getFullYear()}`;
          return depositMonth === monthKey;
        });
        
        const goalMonthTotal = monthDeposits.reduce((sum, d) => sum + d.amount, 0);
        monthTotal += goalMonthTotal;
        
        if (goalMonthTotal > 0) {
          const goalName = goal.name.length > 12 ? goal.name.substring(0, 12) + '...' : goal.name;
          goalsByMonth[goalName] = (goalsByMonth[goalName] || 0) + goalMonthTotal;
        }
      });
      
      months.push({
        month: monthKey.split('/')[0] + '/' + monthKey.split('/')[1].slice(-2),
        saved: monthTotal,
        goals: goalsByMonth,
      });
    }
    
    return months;
  }, [savingsGoals]);

  // Dados de evolução acumulada por objetivo
  const evolutionData = useMemo(() => {
    const months: Array<{ month: string }> = [];
    const currentDate = new Date();
    
    // Gera últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      const monthData: Record<string, any> = {
        month: monthKey.split('/')[0] + '/' + monthKey.split('/')[1].slice(-2),
      };
      
      savingsGoals.forEach(goal => {
        // Calcula total acumulado até este mês
        const totalUntilMonth = goal.deposits
          .filter(d => {
            const depositDate = new Date(d.date);
            const depositMonth = `${String(depositDate.getMonth() + 1).padStart(2, '0')}/${depositDate.getFullYear()}`;
            return depositMonth <= monthKey;
          })
          .reduce((sum, d) => sum + d.amount, 0);
        
        const goalName = goal.name.length > 12 ? goal.name.substring(0, 12) + '...' : goal.name;
        monthData[goalName] = totalUntilMonth;
      });
      
      months.push(monthData);
    }
    
    return months;
  }, [savingsGoals]);

  // Dados de distribuição por pessoa
  const distributionData = useMemo(() => {
    const byPerson: Record<string, { current: number; target: number }> = {};
    
    savingsGoals.forEach(goal => {
      if (!byPerson[goal.owner]) {
        byPerson[goal.owner] = { current: 0, target: 0 };
      }
      byPerson[goal.owner].current += goal.currentAmount;
      byPerson[goal.owner].target += goal.targetAmount;
    });
    
    return Object.entries(byPerson).map(([person, data]) => ({
      name: person,
      Atual: data.current,
      Meta: data.target,
    }));
  }, [savingsGoals]);

  const renderChart = () => {
    if (viewMode === 'progress') {
      // Gráfico de progresso dos objetivos
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={progressData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="Atual" stackId="a" fill={colors.success[500]} />
            <Bar dataKey="Restante" stackId="a" fill={colors.neutral[300]} />
            <Bar dataKey="Meta" fill="none" stroke={colors.primary[600]} strokeDasharray="5 5" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (viewMode === 'trend') {
      // Gráfico de tendência
      if (chartType === 'line') {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="saved" 
                stroke={colors.success[600]} 
                strokeWidth={2}
                name="Total Depositado"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      } else {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="saved" fill={colors.success[500]} name="Total Depositado" />
            </BarChart>
          </ResponsiveContainer>
        );
      }
    } else {
      // Distribuição por pessoa
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-700">Distribuição Atual</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: R$ ${entry.Atual.toFixed(0)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="Atual"
                >
                  {distributionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors.person[entry.name.toLowerCase() as keyof typeof colors.person] || colors.category[index % colors.category.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-700">Comparativo Atual vs Meta</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Atual" fill={colors.success[500]} />
                <Bar dataKey="Meta" fill={colors.primary[400]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
  };

  if (savingsGoals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visualização</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="progress">Progresso dos Objetivos</option>
              <option value="trend">Tendência de Depósitos</option>
              <option value="distribution">Distribuição por Pessoa</option>
            </select>
          </div>
          
          {viewMode === 'trend' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gráfico</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="line">Linha</option>
                <option value="bar">Barras</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Gráfico Principal */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {viewMode === 'progress' && 'Progresso dos Objetivos'}
          {viewMode === 'trend' && 'Tendência de Depósitos - Últimos 12 Meses'}
          {viewMode === 'distribution' && 'Distribuição por Pessoa'}
        </h3>
        {renderChart()}
      </Card>

      {/* Gráfico de Evolução Acumulada (sempre visível) */}
      {viewMode !== 'distribution' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Evolução Acumulada por Objetivo</h3>
          {evolutionData.length > 0 && evolutionData[0] && Object.keys(evolutionData[0]).filter(k => k !== 'month').length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                {Object.keys(evolutionData[0])
                  .filter(key => key !== 'month')
                  .map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colors.category[index % colors.category.length]}
                      strokeWidth={2}
                      name={key}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-20">Nenhum depósito registrado</p>
          )}
        </Card>
      )}
    </div>
  );
};

