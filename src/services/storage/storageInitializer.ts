/**
 * Inicializa dados mockados no localStorage quando necessário
 * Este arquivo será removido quando a integração com backend for implementada
 */
import { localStorageService } from './localStorageService';
import { mockTransactions, mockBudgets, mockCreditCards, mockSavingsGoals, mockCategories, mockClosedMonths } from '../api/mockData';

const INITIALIZED_KEY = 'data_initialized';

/**
 * Inicializa dados mockados se ainda não foram inicializados
 */
export async function initializeMockData(): Promise<void> {
  try {
    // Verifica se os dados já foram inicializados
    const initialized = await localStorageService.has(INITIALIZED_KEY);
    if (initialized) {
      console.log('Dados já inicializados');
      return;
    }

    console.log('Inicializando dados mockados no localStorage...');

    // Inicializa cada conjunto de dados apenas se não existirem
    const storageKeys = {
      transactions: 'transactions',
      budgets: 'budgets',
      creditCards: 'creditCards',
      savingsGoals: 'savingsGoals',
      categories: 'categories',
      closedMonths: 'closedMonths',
    };

    // Inicializa transações
    if (!(await localStorageService.has(storageKeys.transactions))) {
      await localStorageService.set(
        storageKeys.transactions,
        JSON.stringify(mockTransactions)
      );
      console.log('✓ Transações inicializadas');
    }

    // Inicializa orçamentos
    if (!(await localStorageService.has(storageKeys.budgets))) {
      await localStorageService.set(
        storageKeys.budgets,
        JSON.stringify(mockBudgets)
      );
      console.log('✓ Orçamentos inicializados');
    }

    // Inicializa cartões de crédito
    if (!(await localStorageService.has(storageKeys.creditCards))) {
      await localStorageService.set(
        storageKeys.creditCards,
        JSON.stringify(mockCreditCards)
      );
      console.log('✓ Cartões de crédito inicializados');
    }

    // Inicializa objetivos de poupança
    if (!(await localStorageService.has(storageKeys.savingsGoals))) {
      await localStorageService.set(
        storageKeys.savingsGoals,
        JSON.stringify(mockSavingsGoals)
      );
      console.log('✓ Objetivos de poupança inicializados');
    }

    // Inicializa categorias
    if (!(await localStorageService.has(storageKeys.categories))) {
      await localStorageService.set(
        storageKeys.categories,
        JSON.stringify(mockCategories)
      );
      console.log('✓ Categorias inicializadas');
    }

    // Inicializa meses fechados
    if (!(await localStorageService.has(storageKeys.closedMonths))) {
      await localStorageService.set(
        storageKeys.closedMonths,
        JSON.stringify(mockClosedMonths)
      );
      console.log('✓ Meses fechados inicializados');
    }

    // Marca como inicializado
    await localStorageService.set(INITIALIZED_KEY, 'true');
    console.log('✅ Todos os dados mockados foram inicializados com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar dados mockados:', error);
  }
}

/**
 * Reseta todos os dados para os valores mockados (útil para testes)
 */
export async function resetMockData(): Promise<void> {
  try {
    console.log('Resetando dados mockados...');
    
    await localStorageService.set('transactions', JSON.stringify(mockTransactions));
    await localStorageService.set('budgets', JSON.stringify(mockBudgets));
    await localStorageService.set('creditCards', JSON.stringify(mockCreditCards));
    await localStorageService.set('savingsGoals', JSON.stringify(mockSavingsGoals));
    await localStorageService.set('categories', JSON.stringify(mockCategories));
    await localStorageService.set('closedMonths', JSON.stringify(mockClosedMonths));
    
    console.log('✅ Dados resetados com sucesso!');
  } catch (error) {
    console.error('Erro ao resetar dados mockados:', error);
    throw error;
  }
}

/**
 * Limpa todos os dados do localStorage
 */
export async function clearAllData(): Promise<void> {
  try {
    await localStorageService.clear();
    console.log('✅ Todos os dados foram limpos!');
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    throw error;
  }
}

