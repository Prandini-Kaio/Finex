import React, { useState } from 'react';
import type { SavingsGoalForm } from '../../../types';
import { useSavingsContext } from '../SavingsContext';
import { X } from 'lucide-react';

interface SavingsGoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<SavingsGoalForm>;
}

export const SavingsGoalFormModal: React.FC<SavingsGoalFormModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { addSavingsGoal } = useSavingsContext();
  
  const [formData, setFormData] = useState<SavingsGoalForm>({
    name: '',
    targetAmount: '',
    deadline: '',
    owner: 'Kaio',
    description: '',
    ...initialData
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetAmount) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const goalData = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline || undefined,
        owner: formData.owner,
        description: formData.description
      };

      await addSavingsGoal(goalData);
      onClose();
      setFormData({
        name: '',
        targetAmount: '',
        deadline: '',
        owner: 'Kaio',
        description: ''
      });
    } catch (error) {
      console.error('Erro ao criar objetivo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Novo Objetivo de Poupança</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Objetivo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Viagem, Carro, Emergência..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detalhes sobre o objetivo"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Meta (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
              placeholder="0.00"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (Opcional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
            <select
              value={formData.owner}
              onChange={(e) => setFormData({...formData, owner: e.target.value as any})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option>Kaio</option>
              <option>Gabriela</option>
              <option>Ambos</option>
            </select>
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
              Criar Objetivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
