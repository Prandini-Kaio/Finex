/**
 * Serviço de armazenamento local usando localStorage
 * Esta implementação é temporária para desenvolvimento
 * No futuro, será substituída por uma integração com backend
 */
export class LocalStorageService {
  private prefix = 'finance_control_';

  /**
   * Obtém um valor do localStorage
   */
  async get(key: string): Promise<{ value: string } | null> {
    try {
      const fullKey = this.prefix + key;
      const value = localStorage.getItem(fullKey);
      return value ? { value } : null;
    } catch (error) {
      console.error(`Erro ao ler do localStorage (${key}):`, error);
      return null;
    }
  }

  /**
   * Salva um valor no localStorage
   */
  async set(key: string, value: string): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      localStorage.setItem(fullKey, value);
    } catch (error) {
      console.error(`Erro ao salvar no localStorage (${key}):`, error);
      throw error;
    }
  }

  /**
   * Remove um valor do localStorage
   */
  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`Erro ao remover do localStorage (${key}):`, error);
      throw error;
    }
  }

  /**
   * Limpa todos os dados do aplicativo do localStorage
   */
  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async has(key: string): Promise<boolean> {
    try {
      const fullKey = this.prefix + key;
      return localStorage.getItem(fullKey) !== null;
    } catch (error) {
      console.error(`Erro ao verificar chave no localStorage (${key}):`, error);
      return false;
    }
  }
}

// Instância singleton
export const localStorageService = new LocalStorageService();

