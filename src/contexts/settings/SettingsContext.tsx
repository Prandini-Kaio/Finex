import React, { createContext, useContext, type ReactNode } from 'react';
import type { CreditCard } from '../../types';
import { useCreditCards, useCategories, useAppData } from '../../hooks';

interface SettingsContextType {
  creditCards: CreditCard[];
  categories: string[];
  closedMonths: string[];
  loading: boolean;
  error: string | null;
  addCreditCard: (cardData: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; data?: CreditCard; error?: string }>;
  updateCreditCard: (id: number, cardData: Partial<CreditCard>) => Promise<{ success: boolean; data?: CreditCard; error?: string }>;
  deleteCreditCard: (id: number) => Promise<{ success: boolean; error?: string }>;
  addCategory: (category: string) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (category: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ 
  children 
}) => {
  const creditCardsData = useCreditCards();
  const categoriesData = useCategories();
  const appData = useAppData();

  const contextValue: SettingsContextType = {
    creditCards: creditCardsData.creditCards,
    categories: categoriesData.categories,
    closedMonths: appData.closedMonths,
    loading: creditCardsData.loading || categoriesData.loading,
    error: creditCardsData.error || categoriesData.error,
    addCreditCard: creditCardsData.addCreditCard,
    updateCreditCard: creditCardsData.updateCreditCard,
    deleteCreditCard: creditCardsData.deleteCreditCard,
    addCategory: categoriesData.addCategory,
    deleteCategory: categoriesData.deleteCategory,
    refresh: async () => {
      await Promise.all([
        creditCardsData.refresh(),
        categoriesData.refresh(),
        appData.refresh()
      ]);
    }
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext deve ser usado dentro de um SettingsProvider');
  }
  return context;
};
