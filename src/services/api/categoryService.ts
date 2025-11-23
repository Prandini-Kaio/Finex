import { BaseApiService } from './base';
import type { ICategoryService, ApiResponse } from './types';

export class CategoryService extends BaseApiService implements ICategoryService {
  constructor() {
    super('categories');
  }

  async getAll(): Promise<ApiResponse<string[]>> {
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
      console.error('Erro ao buscar categorias:', error);
      return this.createErrorResponse('Erro ao buscar categorias');
    }
  }

  async create(category: string): Promise<ApiResponse<string>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<string>();
      
      if (data.includes(category)) {
        return this.createErrorResponse('Categoria já existe');
      }

      const updatedData = [...data, category];
      await this.saveToStorage(updatedData);

      return this.createSuccessResponse(category, 'Categoria criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return this.createErrorResponse('Erro ao criar categoria');
    }
  }

  async delete(category: string): Promise<ApiResponse<void>> {
    await this.delay();
    
    try {
      const data = await this.getFromStorage<string>();
      const filteredData = data.filter(c => c !== category);
      
      if (data.length === filteredData.length) {
        return this.createErrorResponse('Categoria não encontrada');
      }

      await this.saveToStorage(filteredData);
      return this.createSuccessResponse(undefined, 'Categoria excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      return this.createErrorResponse('Erro ao excluir categoria');
    }
  }
}
