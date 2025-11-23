import React, { useState, useEffect } from 'react';
import type { Transaction, TransactionForm } from '../../../types';
import { useTransactionContext } from '../TransactionContext';
import { useCreditCards, useCategories } from '../../../hooks';
import { X } from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<TransactionForm>;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const { addTransaction } = useTransactionContext();
  const { creditCards } = useCreditCards();
  const { categories } = useCategories();
  
  const [formData, setFormData] = useState<TransactionForm>({
    date: new Date().toISOString().split('T')[0],
    type: 'Despesa',
    paymentMethod: 'Crédito',
    person: 'Kaio',
    category: 'Alimentação',
    description: '',
    value: '',
    competency: '01/2025',
    creditCard: '',
    installments: '1',
    installmentNumber: 1,
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
    
    if (!formData.value || !formData.description) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.paymentMethod === 'Crédito' && !formData.creditCard) {
      alert('Selecione um cartão de crédito');
      return;
    }

    setLoading(true);

    const installments = parseInt(formData.installments) || 1;
    const value = parseFloat(formData.value);
    const installmentValue = value / installments;

    try {
      // Se for parcelado, criar múltiplas transações
      if (installments > 1) {
        const purchaseDate = new Date(formData.date);
        
        for (let i = 0; i < installments; i++) {
          const competencyDate = new Date(purchaseDate);
          competencyDate.setMonth(competencyDate.getMonth() + i);
          const competency = `${String(competencyDate.getMonth() + 1).padStart(2, '0')}/${competencyDate.getFullYear()}`;
          
          const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
            date: formData.date,
            type: formData.type,
            paymentMethod: formData.paymentMethod,
            person: formData.person,
            category: formData.category,
            description: formData.description,
            value: installmentValue,
            competency,
            creditCard: formData.creditCard ? parseInt(formData.creditCard) : undefined,
            installments: 1,
            installmentNumber: i + 1,
            totalInstallments: installments,
            parentPurchase: Date.now()
          };

          await addTransaction(transactionData);
        }
      } else {
        const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
          date: formData.date,
          type: formData.type,
          paymentMethod: formData.paymentMethod,
          person: formData.person,
          category: formData.category,
          description: formData.description,
          value,
          competency: formData.competency,
          creditCard: formData.creditCard ? parseInt(formData.creditCard) : undefined,
          installments: 1,
          installmentNumber: 1
        };

        await addTransaction(transactionData);
      }

      onClose();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Despesa',
        paymentMethod: 'Crédito',
        person: 'Kaio',
        category: 'Alimentação',
        description: '',
        value: '',
        competency: '01/2025',
        creditCard: '',
        installments: '1',
        installmentNumber: 1
      });
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Novo Lançamento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as 'Despesa' | 'Receita'})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option>Despesa</option>
              <option>Receita</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option>Crédito</option>
              <option>Débito</option>
              <option>Dinheiro</option>
              <option>PIX</option>
            </select>
          </div>

          {formData.paymentMethod === 'Crédito' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cartão de Crédito</label>
                <select
                  value={formData.creditCard}
                  onChange={(e) => setFormData({...formData, creditCard: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Selecione um cartão</option>
                  {creditCards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.name} - {card.owner}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Parcelas</label>
                <select
                  value={formData.installments}
                  onChange={(e) => setFormData({...formData, installments: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                    <option key={n} value={n}>
                      {n}x {n > 1 && formData.value ? `(R$ ${(parseFloat(formData.value) / n).toFixed(2)} cada)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Compras no mercado"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              placeholder="0.00"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
