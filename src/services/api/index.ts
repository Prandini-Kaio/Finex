// Importa e exporta todos os serviços da API
import { TransactionService } from './transactionService';
import { BudgetService } from './budgetService';
import { CreditCardService } from './creditCardService';
import { SavingsGoalService } from './savingsGoalService';
import { CategoryService } from './categoryService';
import { AppDataService } from './appDataService';

export { TransactionService, BudgetService, CreditCardService, SavingsGoalService, CategoryService, AppDataService };

// Exporta tipos
export type {
  TransactionFilters,
  BudgetFilters,
  SavingsGoalFilters,
  ITransactionService,
  IBudgetService,
  ICreditCardService,
  ISavingsGoalService,
  ICategoryService,
  IAppDataService,
} from './types';

// Classe principal para gerenciar todos os serviços
export class ApiService {
  public readonly transactions: TransactionService;
  public readonly budgets: BudgetService;
  public readonly creditCards: CreditCardService;
  public readonly savingsGoals: SavingsGoalService;
  public readonly categories: CategoryService;
  public readonly appData: AppDataService;

  constructor() {
    this.transactions = new TransactionService();
    this.budgets = new BudgetService();
    this.creditCards = new CreditCardService();
    this.savingsGoals = new SavingsGoalService();
    this.categories = new CategoryService();
    this.appData = new AppDataService();
  }
}

// Instância singleton para uso em toda a aplicação
export const apiService = new ApiService();
