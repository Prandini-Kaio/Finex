import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { FinanceFilters } from '../types/finance'
import { DEFAULT_FILTERS, getCurrentCompetency } from '../utils/finance'

export type PeriodState = {
  mode: 'single' | 'multi'
  values: string[]
}

interface FilterContextValue {
  filters: FinanceFilters
  setFilters: (filters: FinanceFilters) => void
  period: PeriodState
  setPeriod: (period: PeriodState) => void
  selectedMonth: string
  setSelectedMonth: (month: string) => void
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FinanceFilters>(DEFAULT_FILTERS)
  const [selectedMonth, setSelectedMonthState] = useState(getCurrentCompetency)

  const period: PeriodState = useMemo(
    () => ({
      mode: filters.competencies.length > 1 ? 'multi' : 'single',
      values: filters.competencies.length > 0 ? filters.competencies : [selectedMonth],
    }),
    [filters.competencies, selectedMonth],
  )

  const setPeriod = (next: PeriodState) => {
    setFilters({ ...filters, competencies: next.values })
    if (next.values.length > 0) {
      setSelectedMonthState(next.values[0])
    }
  }

  const setSelectedMonth = (month: string) => {
    setSelectedMonthState(month)
    if (filters.competencies.length <= 1) {
      setFilters({ ...filters, competencies: [month] })
    }
  }

  const value = useMemo(
    () => ({ filters, setFilters, period, setPeriod, selectedMonth, setSelectedMonth }),
    [filters, period, selectedMonth],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
