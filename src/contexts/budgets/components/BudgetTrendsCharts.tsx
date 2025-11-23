import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../../../components/ui';
import { colors } from '../../../design-system';
import { apiService } from '../../../services/api';
import type { Budget } from '../../../types';

interface BudgetTrendsChartsProps {
  selectedMonth: string;
  budgets: Budget[];
}

type ViewMode = 'all' | 'byCategory' | 'byPerson';
type ChartType = 'line' | 'bar';

export const BudgetTrendsCharts: React.FC<BudgetTrendsChartsProps> = ({
  selectedMonth,
  budgets,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [yearlyData, setYearlyData] = useState<Array<{
    month: string;
    budgeted: number;
    spent: number;
    byCategory?: Record<string, { budgeted: number; spent: number }>;
    byPerson?: Record<string, { budgeted: number; spent: number }>;
  }>>([]);
  const [loading, setLoading] = useState(true);

  // Gera lista de 12 meses a partir do mês selecionado
  const getYearMonths = useMemo(() => {
    const [monthStr, yearStr] = selectedMonth.split('/').map(Number);
    const months: string[] = [];
    
    for (let i = 0; i < 12; i++) {
      let m = monthStr - 11 + i;
      let y = yearStr;
      
      if (m < 1) {
        m += 12;
        y -= 1;
      } else if (m > 12) {
        m -= 12;
        y += 1;
      }
      
      months.push(`${String(m).padStart(2, '0')}/${y}`);
    }
    
    return months;
  }, [selectedMonth]);

  // Busca dados históricos
  React.useEffect(() => {
    const fetchYearlyData = async () => {
      setLoading(true);
      try {
        // Busca todos os orçamentos do período
        const allBudgetsResponse = await apiService.budgets.getAll({});
        const allBudgets = allBudgetsResponse.success ? allBudgetsResponse.data : [];
        
        // Busca todas as transações do período
        const allTransactionsResponse = await apiService.transactions.getAll({});
        const allTransactions = allTransactionsResponse.success ? (allTransactionsResponse.data.data || []) : [];

        const monthlyData = getYearMonths.map(monthKey => {
          // Orçamentos do mês
          const monthBudgets = allBudgets.filter(b => b.competency === monthKey);
          const totalBudgeted = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
          
          // Transações do mês
          const monthTransactions = allTransactions.filter(t => t.competency === monthKey && t.type === 'Despesa');
          const totalSpent = monthTransactions.reduce((sum, t) => sum + t.value, 0);

          // Por categoria
          const byCategory: Record<string, { budgeted: number; spent: number }> = {};
          monthBudgets.forEach(budget => {
            if (!byCategory[budget.category]) {
              byCategory[budget.category] = { budgeted: 0, spent: 0 };
            }
            byCategory[budget.category].budgeted += budget.amount;
            
            const categorySpent = monthTransactions
              .filter(t => t.category === budget.category && t.person === budget.person)
              .reduce((sum, t) => sum + t.value, 0);
            byCategory[budget.category].spent += categorySpent;
          });

          // Por pessoa
          const byPerson: Record<string, { budgeted: number; spent: number }> = {};
          monthBudgets.forEach(budget => {
            if (!byPerson[budget.person]) {
              byPerson[budget.person] = { budgeted: 0, spent: 0 };
            }
            byPerson[budget.person].budgeted += budget.amount;
          });
          
          // Calcula gastos por pessoa (independente da categoria do orçamento)
          const people = ['Kaio', 'Gabriela', 'Ambos'];
          people.forEach(person => {
            if (!byPerson[person]) {
              byPerson[person] = { budgeted: 0, spent: 0 };
            }
            const personSpent = monthTransactions
              .filter(t => t.person === person)
              .reduce((sum, t) => sum + t.value, 0);
            byPerson[person].spent = personSpent;
          });

          return {
            month: monthKey,
            budgeted: totalBudgeted,
            spent: totalSpent,
            byCategory,
            byPerson,
          };
        });

        setYearlyData(monthlyData);
      } catch (error) {
        console.error('Erro ao buscar dados históricos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchYearlyData();
  }, [selectedMonth, getYearMonths]);

  // Formata dados para o gráfico baseado no modo de visualização
  const chartData = useMemo(() => {
    if (viewMode === 'all') {
      return yearlyData.map(d => ({
        month: d.month.split('/')[0] + '/' + d.month.split('/')[1].slice(-2),
        Orçado: d.budgeted,
        Gasto: d.spent,
      }));
    } else if (viewMode === 'byCategory') {
      // Agrupa todas as categorias encontradas
      const categories = new Set<string>();
      yearlyData.forEach(d => {
        Object.keys(d.byCategory || {}).forEach(cat => categories.add(cat));
      });

      return yearlyData.map(d => {
        const data: Record<string, any> = {
          month: d.month.split('/')[0] + '/' + d.month.split('/')[1].slice(-2),
        };
        
        categories.forEach(cat => {
          const catData = d.byCategory?.[cat] || { budgeted: 0, spent: 0 };
          data[`${cat} - Orçado`] = catData.budgeted;
          data[`${cat} - Gasto`] = catData.spent;
        });
        
        return data;
      });
    } else {
      // byPerson
      const people = ['Kaio', 'Gabriela', 'Ambos'];
      
      return yearlyData.map(d => {
        const data: Record<string, any> = {
          month: d.month.split('/')[0] + '/' + d.month.split('/')[1].slice(-2),
        };
        
        people.forEach(person => {
          const personData = d.byPerson?.[person] || { budgeted: 0, spent: 0 };
          data[`${person} - Orçado`] = personData.budgeted;
          data[`${person} - Gasto`] = personData.spent;
        });
        
        return data;
      });
    }
  }, [yearlyData, viewMode]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 animate-pulse h-80 rounded-lg"></div>
        <div className="bg-gray-100 animate-pulse h-80 rounded-lg"></div>
      </div>
    );
  }

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            <Legend />
            {Object.keys(chartData[0] || {}).filter(key => key !== 'month').map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={key.includes('Orçado') ? colors.primary[600] : (key.includes('Gasto') ? colors.error[500] : colors.category[index % colors.category.length])}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            <Legend />
            {Object.keys(chartData[0] || {}).filter(key => key !== 'month').map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={key.includes('Orçado') ? colors.primary[400] : (key.includes('Gasto') ? colors.error[400] : colors.category[index % colors.category.length])}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

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
              <option value="all">Geral</option>
              <option value="byCategory">Por Categoria</option>
              <option value="byPerson">Por Pessoa</option>
            </select>
          </div>
          
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
        </div>
      </Card>

      {/* Gráfico de Tendência */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Tendência de Orçado vs Gasto - Últimos 12 Meses
        </h3>
        {chartData.length > 0 ? (
          renderChart()
        ) : (
          <p className="text-gray-400 text-center py-20">Nenhum dado disponível</p>
        )}
      </Card>

      {/* Gráfico de Evolução Mensal */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Evolução Mensal - Comparativo</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              {viewMode === 'all' ? (
                <>
                  <Bar dataKey="Orçado" fill={colors.primary[500]} />
                  <Bar dataKey="Gasto" fill={colors.error[500]} />
                </>
              ) : (
                Object.keys(chartData[0] || {})
                  .filter(key => key !== 'month')
                  .map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={key.includes('Orçado') ? colors.primary[400 + (index % 2) * 200] : colors.error[400 + (index % 2) * 200]}
                      name={key}
                    />
                  ))
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-20">Nenhum dado disponível</p>
        )}
      </Card>
    </div>
  );
};

