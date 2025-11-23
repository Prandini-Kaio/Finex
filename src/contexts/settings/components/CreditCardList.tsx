import React from 'react';
import { useSettingsContext } from '../SettingsContext';
import { Plus, Trash2, CreditCard } from 'lucide-react';

interface CreditCardListProps {
  onAddCard: () => void;
}

export const CreditCardList: React.FC<CreditCardListProps> = ({ onAddCard }) => {
  const { creditCards, deleteCreditCard, loading } = useSettingsContext();

  const handleDeleteCard = async (id: number) => {
    if (window.confirm('Deseja realmente excluir este cartão?')) {
      try {
        await deleteCreditCard(id);
      } catch (error) {
        console.error('Erro ao excluir cartão:', error);
      }
    }
  };

  const getOwnerColor = (owner: string) => {
    const colors = {
      'Kaio': 'bg-blue-100 text-blue-700',
      'Gabriela': 'bg-pink-100 text-pink-700',
      'Ambos': 'bg-purple-100 text-purple-700'
    };
    return colors[owner as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CreditCard size={20} />
          Cartões de Crédito
        </h3>
        <button
          onClick={onAddCard}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} />
          Adicionar Cartão
        </button>
      </div>
      
      {creditCards.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Titular</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Limite</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Fechamento</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Vencimento</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {creditCards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{card.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOwnerColor(card.owner)}`}>
                      {card.owner}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    R$ {card.limit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {card.closingDay}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {card.dueDay}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-400 text-lg mb-4">Nenhum cartão cadastrado</p>
          <button
            onClick={onAddCard}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Adicionar seu primeiro cartão
          </button>
        </div>
      )}
    </div>
  );
};
