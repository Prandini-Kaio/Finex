import { BaseApiService } from './base';
import type { IAppDataService, ApiResponse } from './types';

export class AppDataService extends BaseApiService implements IAppDataService {
  constructor() {
    super('closedMonths');
  }

  async getClosedMonths(): Promise<ApiResponse<string[]>> {
    await this.delay();
    
    try {
      let data = await this.getFromStorage<string>();
      
      // Se não há dados no storage, retorna array vazio
      // A inicialização é feita pelo storageInitializer
      if (!data || data.length === 0) {
        data = [];
      }

      return this.createSuccessResponse(data);
    } catch (error) {
      console.error('Erro ao buscar meses fechados:', error);
      return this.createErrorResponse('Erro ao buscar meses fechados');
    }
  }

  async addClosedMonth(month: string): Promise<ApiResponse<string[]>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<string>();
      
      if (data.includes(month)) {
        return this.createErrorResponse('Mês já está fechado');
      }

      const updatedData = [...data, month];
      await this.saveToStorage(updatedData);

      return this.createSuccessResponse(updatedData, 'Mês fechado com sucesso');
    } catch (error) {
      console.error('Erro ao fechar mês:', error);
      return this.createErrorResponse('Erro ao fechar mês');
    }
  }

  async removeClosedMonth(month: string): Promise<ApiResponse<string[]>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<string>();
      const filteredData = data.filter(m => m !== month);
      
      if (data.length === filteredData.length) {
        return this.createErrorResponse('Mês não está fechado');
      }

      await this.saveToStorage(filteredData);
      return this.createSuccessResponse(filteredData, 'Mês reaberto com sucesso');
    } catch (error) {
      console.error('Erro ao reabrir mês:', error);
      return this.createErrorResponse('Erro ao reabrir mês');
    }
  }
}
