import React, { useState } from 'react';
import { useSettingsContext } from '../SettingsContext';
import { Plus, X } from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const { categories, addCategory, deleteCategory, loading } = useSettingsContext();
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    if (categories.includes(newCategory.trim())) {
      alert('Esta categoria já existe');
      return;
    }

    setIsAdding(true);
    try {
      await addCategory(newCategory.trim());
      setNewCategory('');
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (window.confirm(`Deseja excluir a categoria "${category}"?`)) {
      try {
        await deleteCategory(category);
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Gerenciar Categorias</h3>
      
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nova categoria"
              className="w-full px-4 py-2 border rounded-lg"
            disabled={isAdding}
          />
        </div>
        <button
          onClick={handleAddCategory}
          disabled={!newCategory.trim() || isAdding || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={18} />
          {isAdding ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <div 
            key={category} 
            className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors group"
          >
            <span className="text-sm font-medium text-gray-700">{category}</span>
            <button
              onClick={() => handleDeleteCategory(category)}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
              disabled={loading}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-gray-400 text-center py-8">Nenhuma categoria cadastrada</p>
      )}
    </div>
  );
};
