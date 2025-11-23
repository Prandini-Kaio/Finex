import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  value: string; // MM/AAAA
  onChange: (value: string) => void;
  className?: string;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  // Parse MM/AAAA
  const [month, year] = value.split('/').map(Number);

  const handlePreviousMonth = () => {
    let newMonth = month - 1;
    let newYear = year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    onChange(`${String(newMonth).padStart(2, '0')}/${newYear}`);
  };

  const handleNextMonth = () => {
    let newMonth = month + 1;
    let newYear = year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    onChange(`${String(newMonth).padStart(2, '0')}/${newYear}`);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    onChange(`${String(newMonth).padStart(2, '0')}/${year}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    onChange(`${String(month).padStart(2, '0')}/${newYear}`);
  };

  // Gera lista de anos (5 anos atrás até 5 anos à frente)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handlePreviousMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Mês anterior"
        type="button"
      >
        <ChevronLeft size={20} className="text-gray-600" />
      </button>

      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 min-w-[180px]">
        <select
          value={month}
          onChange={handleMonthChange}
          className="text-sm font-medium text-gray-800 bg-transparent border-none outline-none cursor-pointer flex-1"
        >
          {monthNames.map((name, index) => (
            <option key={index} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <span className="text-gray-400">/</span>

        <select
          value={year}
          onChange={handleYearChange}
          className="text-sm font-medium text-gray-800 bg-transparent border-none outline-none cursor-pointer w-20"
        >
          {years.map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleNextMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Próximo mês"
        type="button"
      >
        <ChevronRight size={20} className="text-gray-600" />
      </button>
    </div>
  );
};

