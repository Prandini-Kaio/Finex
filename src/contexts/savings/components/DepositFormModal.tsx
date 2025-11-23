import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSavingsContext } from '../SavingsContext';
import { Input, Button } from '../../../components/ui';
import { apiService } from '../../../services/api';
import type { SavingsGoal } from '../../../types';

interface DepositFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
}

export const DepositFormModal: React.FC<DepositFormModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { addDeposit } = useSavingsContext();
  
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    createTransaction: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && goal) {
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        createTransaction: false,
      });
    }
  }, [isOpen, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goal || !formData.amount) {
      alert('Preencha o valor do depósito');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Valor deve ser maior que zero');
      return;
    }

    setLoading(true);

    try {
      // Adiciona o depósito
      const result = await addDeposit(goal.id, {
        amount,
        date: formData.date,
      });

      if (result.success) {
        // Se marcou para criar transação, cria uma transação de despesa associada
        if (formData.createTransaction) {
          try {
            const depositDate = new Date(formData.date);
            const month = `${String(depositDate.getMonth() + 1).padStart(2, '0')}/${depositDate.getFullYear()}`;
            
            // Verifica se a categoria existe, se não existir, cria
            const categoriesResponse = await apiService.categories.getAll();
            const categories = categoriesResponse.success ? categoriesResponse.data : [];
            
            if (!categories.includes('Poupança')) {
              await apiService.categories.create('Poupança');
            }
            
            await apiService.transactions.create({
              date: formData.date,
              type: 'Despesa',
              paymentMethod: 'PIX',
              person: goal.owner,
              category: 'Poupança',
              description: `Depósito para: ${goal.name}`,
              value: amount,
              competency: month,
              installments: 1,
              installmentNumber: 1,
            });
          } catch (error) {
            console.error('Erro ao criar transação associada:', error);
            // Não bloqueia o fluxo se falhar criar a transação
          }
        }
        
        onClose();
        setFormData({
          amount: '',
          date: new Date().toISOString().split('T')[0],
          createTransaction: false,
        });
      } else {
        alert(result.error || 'Erro ao adicionar depósito');
      }
    } catch (error) {
      console.error('Erro ao adicionar depósito:', error);
      alert('Erro inesperado ao adicionar depósito');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !goal) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  const percentage = (goal.currentAmount / goal.targetAmount) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Adicionar Depósito</h2>
            <p className="text-sm text-gray-600 mt-1">{goal.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Informações do Objetivo */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Atual:</span>
            <span className="font-semibold">R$ {goal.currentAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Meta:</span>
            <span className="font-semibold">R$ {goal.targetAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Restante:</span>
            <span className="font-semibold text-green-600">R$ {remaining.toFixed(2)}</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progresso</span>
              <span>{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Valor do Depósito (R$)"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0.00"
            required
          />

          <Input
            label="Data do Depósito"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="createTransaction"
              checked={formData.createTransaction}
              onChange={(e) => setFormData({...formData, createTransaction: e.target.checked})}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="createTransaction" className="ml-2 text-sm text-gray-700">
              Criar transação de saída associada (para rastreamento)
            </label>
          </div>

          {formData.createTransaction && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Uma transação de despesa será criada automaticamente para rastrear a saída de dinheiro para a poupança.
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Adicionando...' : 'Adicionar Depósito'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

