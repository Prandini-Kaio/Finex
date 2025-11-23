import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Transaction, FinancialStats } from '../../types';
import type { TransactionFilters } from '../../services/api';
import { useTransactions } from '../../hooks';
import { apiService } from '../../services/api';

interface TransactionContextType {
  transactions: Transaction[];
  stats: FinancialStats | null;
  loading: boolean;
  error: string | null;
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; data?: Transaction; error?: string }>;
  updateTransaction: (id: number, transactionData: Partial<Transaction>) => Promise<{ success: boolean; data?: Transaction; error?: string }>;
  deleteTransaction: (id: number) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

interface TransactionProviderProps {
  children: ReactNode;
  filters?: TransactionFilters;
  includeRelatedTransactions?: boolean;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ 
  children, 
  filters = {},
  includeRelatedTransactions = false
}) => {
  const transactionData = useTransactions(filters);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  // Busca transações relacionadas (parcelas de outros meses)
  useEffect(() => {
    if (includeRelatedTransactions && transactionData.transactions.length > 0) {
      const fetchRelatedTransactions = async () => {
        try {
          // Busca todas as transações para encontrar relacionadas
          const allResponse = await apiService.transactions.getAll({});
          if (allResponse.success && allResponse.data.data) {
            const all = allResponse.data.data;
            const existingIds = new Set(transactionData.transactions.map(t => t.id));
            const related: Transaction[] = [];
            
            // Para cada transação filtrada
            transactionData.transactions.forEach(trans => {
              if (trans.totalInstallments && trans.totalInstallments > 1) {
                // É uma transação pai - busca todas as parcelas (filhas)
                const children = all.filter(t => t.parentPurchase === trans.id);
                related.push(...children);
              } else if (trans.parentPurchase) {
                // É uma parcela (filha) - busca o pai e todas as outras parcelas
                const parent = all.find(t => t.id === trans.parentPurchase);
                if (parent && !existingIds.has(parent.id)) {
                  related.push(parent);
                }
                // Busca outras parcelas do mesmo pai
                const siblings = all.filter(t => 
                  t.parentPurchase === trans.parentPurchase && 
                  t.id !== trans.id &&
                  !existingIds.has(t.id)
                );
                related.push(...siblings);
              }
            });

            // Remove duplicatas
            const uniqueRelated = related.filter((t, index, self) => 
              index === self.findIndex(r => r.id === t.id) && !existingIds.has(t.id)
            );
            
            setAllTransactions([...transactionData.transactions, ...uniqueRelated]);
          }
        } catch (error) {
          console.error('Erro ao buscar transações relacionadas:', error);
          setAllTransactions(transactionData.transactions);
        }
      };

      fetchRelatedTransactions();
    } else {
      setAllTransactions(transactionData.transactions);
    }
  }, [transactionData.transactions, includeRelatedTransactions]);

  const value: TransactionContextType = {
    ...transactionData,
    transactions: includeRelatedTransactions ? allTransactions : transactionData.transactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionContext deve ser usado dentro de um TransactionProvider');
  }
  return context;
};
