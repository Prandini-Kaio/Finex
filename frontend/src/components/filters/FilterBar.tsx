import { useMemo } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { useFilters } from '../../context/FilterContext'
import type { FinanceFilters, PaymentMethod } from '../../types/finance'
import { CREDIT_CARD_NONE_VALUE } from '../../types/finance'
import { buildCompetencyOptions } from '../../utils/finance'
import { MultiSelect } from '../MultiSelect'

export type FilterKey = 'persons' | 'categories' | 'paymentMethods' | 'creditCards' | 'competencies'

interface FilterBarProps {
  visibleFilters?: FilterKey[]
  className?: string
}

export const FilterBar: React.FC<FilterBarProps> = ({
  visibleFilters = ['persons', 'categories', 'paymentMethods', 'creditCards', 'competencies'],
  className = '',
}) => {
  const { filters, setFilters } = useFilters()
  const {
    state: { categories, creditCards, persons },
  } = useFinance()

  const personOptions = useMemo(
    () => persons.filter((p) => p.active).map((p) => ({ value: p.name, label: p.name })),
    [persons],
  )
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c, label: c })),
    [categories],
  )
  const paymentOptions = useMemo(
    (): { value: PaymentMethod; label: PaymentMethod }[] => [
      { value: 'Crédito', label: 'Crédito' },
      { value: 'Débito', label: 'Débito' },
      { value: 'Dinheiro', label: 'Dinheiro' },
      { value: 'PIX', label: 'PIX' },
    ],
    [],
  )
  const creditCardOptions = useMemo(
    () => [
      { value: CREDIT_CARD_NONE_VALUE, label: 'Sem cartão' },
      ...creditCards.map((c) => ({ value: String(c.id), label: `${c.name} - ${c.owner}` })),
    ],
    [creditCards],
  )
  const competencyOptions = useMemo(
    () => buildCompetencyOptions().map((c) => ({ value: c, label: c })),
    [],
  )

  const handleChange = <K extends keyof FinanceFilters>(key: K, value: FinanceFilters[K]) => {
    setFilters({ ...filters, [key]: value })
  }

  const cols = visibleFilters.length

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(cols, 5)} gap-3 ${className}`}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))` }}
    >
      {visibleFilters.includes('persons') && (
        <MultiSelect
          options={personOptions}
          value={filters.persons}
          onChange={(v) => handleChange('persons', v)}
          placeholder="Todas as pessoas"
        />
      )}
      {visibleFilters.includes('categories') && (
        <MultiSelect
          options={categoryOptions}
          value={filters.categories}
          onChange={(v) => handleChange('categories', v)}
          placeholder="Todas as categorias"
        />
      )}
      {visibleFilters.includes('paymentMethods') && (
        <MultiSelect
          options={paymentOptions}
          value={filters.paymentMethods}
          onChange={(v) => handleChange('paymentMethods', v as PaymentMethod[])}
          placeholder="Todos os pagamentos"
        />
      )}
      {visibleFilters.includes('creditCards') && (
        <MultiSelect
          options={creditCardOptions}
          value={filters.creditCards}
          onChange={(v) => handleChange('creditCards', v)}
          placeholder="Todos os cartões"
        />
      )}
      {visibleFilters.includes('competencies') && (
        <MultiSelect
          options={competencyOptions}
          value={filters.competencies}
          onChange={(v) => handleChange('competencies', v)}
          placeholder="Todas as competências"
        />
      )}
    </div>
  )
}
