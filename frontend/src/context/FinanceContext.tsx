import { createContext, useContext } from 'react'
import { useFinanceData } from '../hooks/useFinanceData'

const FinanceContext = createContext<ReturnType<typeof useFinanceData> | null>(null)

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const finance = useFinanceData()
  return <FinanceContext.Provider value={finance}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}







