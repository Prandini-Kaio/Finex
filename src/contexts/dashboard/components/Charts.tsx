import React from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import type { FinancialStats, SavingsTrend } from '../../../types';
import { colors } from '../../../design-system';

interface ChartsProps {
  stats: FinancialStats | null;
  savingsTrend: SavingsTrend[];
}

export const Charts: React.FC<ChartsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 animate-pulse h-80 rounded-lg"></div>
        <div className="bg-gray-100 animate-pulse h-80 rounded-lg"></div>
      </div>
    );
  }

  const pieData = Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }));
  const barData = [
    { name: 'Kaio', value: stats.byPerson.Kaio },
    { name: 'Gabriela', value: stats.byPerson.Gabriela },
    { name: 'Ambos', value: stats.byPerson.Ambos }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Despesas por Categoria</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: R${entry.value.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors.category[index % colors.category.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-20">Nenhuma despesa registrada</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Despesas por Pessoa</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors.person[entry.name.toLowerCase() as keyof typeof colors.person]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
