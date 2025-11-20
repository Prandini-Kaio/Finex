import { useState } from 'react'
import { Trash2, Palette, RotateCcw } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useTheme, type ThemeColors } from '../context/ThemeContext'
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

  const { theme, updateColor, resetColors } = useTheme()
  const [newCategory, setNewCategory] = useState('')
  const [cardForm, setCardForm] = useState(cardDefaults)
  const [showColorSettings, setShowColorSettings] = useState(false)

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

  const colorLabels: Record<keyof ThemeColors, string> = {
    primary: 'Primária',
    secondary: 'Secundária',
    accent: 'Destaque',
    success: 'Sucesso',
    warning: 'Aviso',
    error: 'Erro',
    info: 'Informação',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Configurações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie categorias e cartões de crédito utilizados no controle.</p>
      </div>

      {/* Personalização de cores - discreta */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setShowColorSettings(!showColorSettings)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
        >
          <Palette size={16} />
          <span>Personalização de cores</span>
        </button>

        {showColorSettings && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(theme.colors) as Array<keyof ThemeColors>).map((colorKey) => (
                <div key={colorKey} className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                    {colorLabels[colorKey]}:
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={theme.colors[colorKey]}
                      onChange={(e) => updateColor(colorKey, e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 dark:border-slate-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.colors[colorKey]}
                      onChange={(e) => updateColor(colorKey, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={resetColors}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                <RotateCcw size={14} />
                <span>Restaurar padrões</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-4 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Categorias</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200"
            >
              {category}
              <button onClick={() => handleRemoveCategory(category)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
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
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button onClick={handleAddCategory} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
            Adicionar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-4 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Cartões de crédito</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {creditCards.map((card) => (
            <div key={card.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 flex justify-between items-start bg-gray-50 dark:bg-slate-700/50">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{card.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.owner}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Fechamento dia {card.closingDay} • Vencimento dia {card.dueDay}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Limite: R$ {card.limit.toFixed(2)}</p>
              </div>
              <button
                onClick={() => actions.deleteCreditCard(card.id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome
            <input
              type="text"
              value={cardForm.name}
              onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Titular
            <select
              value={cardForm.owner}
              onChange={(event) => setCardForm({ ...cardForm, owner: event.target.value as Person })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Kaio">Kaio</option>
              <option value="Gabriela">Gabriela</option>
              <option value="Ambos">Ambos</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fechamento
            <input
              type="number"
              min="1"
              max="31"
              value={cardForm.closingDay}
              onChange={(event) => setCardForm({ ...cardForm, closingDay: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Vencimento
            <input
              type="number"
              min="1"
              max="31"
              value={cardForm.dueDay}
              onChange={(event) => setCardForm({ ...cardForm, dueDay: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            Limite (R$)
            <input
              type="number"
              step="0.01"
              value={cardForm.limit}
              onChange={(event) => setCardForm({ ...cardForm, limit: event.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button onClick={handleAddCard} className="px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90 transition-opacity">
            Salvar cartão
          </button>
        </div>
      </div>
    </div>
  )
}

