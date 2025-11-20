import React from 'react'

interface MonthYearSelectorProps {
  value: string // Formato: MM/AAAA
  onChange: (value: string) => void
  className?: string
  yearsRange?: number // Quantos anos antes e depois do ano atual mostrar
}

export const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  value,
  onChange,
  className = '',
  yearsRange = 2,
}) => {
  const currentYear = new Date().getFullYear()
  // Garantir que o valor está no formato correto
  const normalizedValue = value && value.includes('/') ? value : `${new Date().getMonth() + 1 < 10 ? '0' : ''}${new Date().getMonth() + 1}/${currentYear}`
  const [month, year] = normalizedValue.split('/')

  const handleMonthChange = (newMonth: string) => {
    const selectedYear = year || currentYear.toString()
    onChange(`${newMonth}/${selectedYear}`)
  }

  const handleYearChange = (newYear: string) => {
    const currentMonth = month || '01'
    onChange(`${currentMonth}/${newYear}`)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
            <select
              value={month || '01'}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            >
        <option value="01">Janeiro</option>
        <option value="02">Fevereiro</option>
        <option value="03">Março</option>
        <option value="04">Abril</option>
        <option value="05">Maio</option>
        <option value="06">Junho</option>
        <option value="07">Julho</option>
        <option value="08">Agosto</option>
        <option value="09">Setembro</option>
        <option value="10">Outubro</option>
        <option value="11">Novembro</option>
        <option value="12">Dezembro</option>
      </select>
            <select
              value={year || currentYear.toString()}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            >
        {Array.from({ length: yearsRange * 2 + 1 }, (_, i) => {
          const year = currentYear - yearsRange + i
          return (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          )
        })}
      </select>
    </div>
  )
}

