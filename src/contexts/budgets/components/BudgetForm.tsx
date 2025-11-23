import React, { useState, useEffect } from 'react';
import type { BudgetForm } from '../../../types';
import { useBudgetContext } from '../BudgetContext';
import { useCategories } from '../../../hooks';
import { X } from 'lucide-react';

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<BudgetForm>;
}

export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { addBudget } = useBudgetContext();
  const { categories } = useCategories();
  
  const [formData, setFormData] = useState<BudgetForm>({
    competency: '01/2025',
    category: 'Alimentação',
    person: 'Kaio',
    amount: '',
    ...initialData
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories, formData.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount) {
      alert('Preencha o valor do orçamento');
      return;
    }

    setLoading(true);

    try {
      const budgetData = {
        competency: formData.competency,
        category: formData.category,
        person: formData.person,
        amount: parseFloat(formData.amount)
      };

      await addBudget(budgetData);
      onClose();
      setFormData({
        competency: '01/2025',
        category: 'Alimentação',
        person: 'Kaio',
        amount: ''
      });
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Definir Orçamento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competência (MM/AAAA)</label>
            <input
              type="text"
              value={formData.competency}
              onChange={(e) => setFormData({...formData, competency: e.target.value})}
              placeholder="10/2025"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {categories.map(cat => <option key={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa</label>
            <select
              value={formData.person}
              onChange={(e) => setFormData({...formData, person: e.target.value as any})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option>Kaio</option>
              <option>Gabriela</option>
              <option>Ambos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Orçamento (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="0.00"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Salvar Orçamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
