import { BaseApiService } from './base';
import type { CreditCard } from '../../types';
import type { ICreditCardService, ApiResponse } from './types';

export class CreditCardService extends BaseApiService implements ICreditCardService {
  constructor() {
    super('creditCards');
  }

  async getAll(): Promise<ApiResponse<CreditCard[]>> {
    await this.delay();
    
    try {
      let data = await this.getFromStorage<CreditCard>();
      
      // Se não há dados no storage, retorna array vazio
      // A inicialização é feita pelo storageInitializer
      if (!data || data.length === 0) {
        data = [];
      }

      return this.createSuccessResponse(data);
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
      return this.createErrorResponse('Erro ao buscar cartões');
    }
  }

  async getById(id: number): Promise<ApiResponse<CreditCard>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<CreditCard>();
      const card = data.find(c => c.id === id);
      
      if (!card) {
        return this.createErrorResponse('Cartão não encontrado');
      }

      return this.createSuccessResponse(card);
    } catch (error) {
      console.error('Erro ao buscar cartão:', error);
      return this.createErrorResponse('Erro ao buscar cartão');
    }
  }

  async create(cardData: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CreditCard>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<CreditCard>();
      
      const newCard: CreditCard = {
        ...cardData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedData = [...data, newCard];
      await this.saveToStorage(updatedData);

      return this.createSuccessResponse(newCard, 'Cartão criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      return this.createErrorResponse('Erro ao criar cartão');
    }
  }

  async update(id: number, cardData: Partial<CreditCard>): Promise<ApiResponse<CreditCard>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<CreditCard>();
      const index = data.findIndex(c => c.id === id);
      
      if (index === -1) {
        return this.createErrorResponse('Cartão não encontrado');
      }

      const updatedCard = {
        ...data[index],
        ...cardData,
        id,
        updatedAt: new Date().toISOString(),
      };

      data[index] = updatedCard;
      await this.saveToStorage(data);

      return this.createSuccessResponse(updatedCard, 'Cartão atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      return this.createErrorResponse('Erro ao atualizar cartão');
    }
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<CreditCard>();
      const filteredData = data.filter(c => c.id !== id);
      
      if (data.length === filteredData.length) {
        return this.createErrorResponse('Cartão não encontrado');
      }

      await this.saveToStorage(filteredData);
      return this.createSuccessResponse(undefined, 'Cartão excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      return this.createErrorResponse('Erro ao excluir cartão');
    }
  }
}
