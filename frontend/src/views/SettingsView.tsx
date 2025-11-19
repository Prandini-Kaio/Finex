import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import type { CreditCardPayload, Person } from '../types/finance'

const cardDefaults: Omit<CreditCardPayload, 'limit'> & { limit: string } = {
  name: '',
  owner: 'Kaio',
  closingDay: '5',
  dueDay: '15',
  limit: '',
}

export const SettingsView: React.FC = () => {
  const {
    state: { categories, creditCards },
    actions,
  } = useFinance()

  const [newCategory, setNewCategory] = useState('')
  const [cardForm, setCardForm] = useState(cardDefaults)

  const handleAddCategory = async () => {
    if (!newCategory || categories.includes(newCategory)) return
    await actions.saveCategories([...categories, newCategory])
    setNewCategory('')
  }

  const handleRemoveCategory = async (category: string) => {
    await actions.saveCategories(categories.filter((item) => item !== category))
  }

  const handleAddCard = async () => {
    if (!cardForm.name || !cardForm.limit) return
    await actions.addCreditCard({
      name: cardForm.name,
      owner: cardForm.owner,
      closingDay: cardForm.closingDay,
      dueDay: cardForm.dueDay,
      limit: Number(cardForm.limit),
    })
    setCardForm(cardDefaults)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie categorias e cartões de crédito utilizados no controle.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="text-lg font-semibold">Categorias</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className="px-3 py-1 rounded-full bg-gray-100 text-sm flex items-center gap-2"
            >
              {category}
              <button onClick={() => handleRemoveCategory(category)} className="text-red-500 hover:text-red-700">
                <Trash2 size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="Nova categoria"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Adicionar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="text-lg font-semibold">Cartões de crédito</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {creditCards.map((card) => (
            <div key={card.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{card.name}</p>
                <p className="text-sm text-gray-500">{card.owner}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Fechamento dia {card.closingDay} • Vencimento dia {card.dueDay}
                </p>
                <p className="text-sm text-gray-600 mt-1">Limite: R$ {card.limit.toFixed(2)}</p>
              </div>
              <button
                onClick={() => actions.deleteCreditCard(card.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-gray-700">
            Nome
            <input
              type="text"
              value={cardForm.name}
              onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Titular
            <select
              value={cardForm.owner}
              onChange={(event) => setCardForm({ ...cardForm, owner: event.target.value as Person })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            >
              <option value="Kaio">Kaio</option>
              <option value="Gabriela">Gabriela</option>
              <option value="Ambos">Ambos</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Fechamento
            <input
              type="number"
              min="1"
              max="31"
              value={cardForm.closingDay}
              onChange={(event) => setCardForm({ ...cardForm, closingDay: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Vencimento
            <input
              type="number"
              min="1"
              max="31"
              value={cardForm.dueDay}
              onChange={(event) => setCardForm({ ...cardForm, dueDay: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Limite (R$)
            <input
              type="number"
              step="0.01"
              value={cardForm.limit}
              onChange={(event) => setCardForm({ ...cardForm, limit: event.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button onClick={handleAddCard} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Salvar cartão
          </button>
        </div>
      </div>
    </div>
  )
}

