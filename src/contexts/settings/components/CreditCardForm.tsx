import React, { useState } from 'react';
import type { CreditCardForm } from '../../../types';
import { useSettingsContext } from '../SettingsContext';
import { X } from 'lucide-react';

interface CreditCardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<CreditCardForm>;
}

export const CreditCardFormModal: React.FC<CreditCardFormModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { addCreditCard } = useSettingsContext();
  
  const [formData, setFormData] = useState<CreditCardForm>({
    name: '',
    owner: 'Kaio',
    closingDay: '5',
    dueDay: '15',
    limit: '',
    ...initialData
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.limit) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const cardData = {
        name: formData.name,
        owner: formData.owner,
        closingDay: parseInt(formData.closingDay),
        dueDay: parseInt(formData.dueDay),
        limit: parseFloat(formData.limit)
      };

      await addCreditCard(cardData);
      onClose();
      setFormData({
        name: '',
        owner: 'Kaio',
        closingDay: '5',
        dueDay: '15',
        limit: ''
      });
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Novo Cartão de Crédito</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cartão</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Nubank, Inter, C6..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titular</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Fechamento</label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.closingDay}
              onChange={(e) => setFormData({...formData, closingDay: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.dueDay}
              onChange={(e) => setFormData({...formData, dueDay: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limite (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.limit}
              onChange={(e) => setFormData({...formData, limit: e.target.value})}
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
