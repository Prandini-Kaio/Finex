import { useState, useEffect } from 'react'
import { Trash2, Palette, RotateCcw, Edit2, X, Check } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useTheme, type ThemeColors } from '../context/ThemeContext'
import type { CreditCardPayload, Person as PersonType } from '../types/finance'

const getCardDefaults = (firstPersonId?: number): Omit<CreditCardPayload, 'limit'> & { limit: string; ownerId: number } => ({
  name: '',
  ownerId: firstPersonId || 0,
  closingDay: '5',
  dueDay: '15',
  limit: '',
})

export const SettingsView: React.FC = () => {
  const {
    state: { categories, creditCards, persons },
    actions,
  } = useFinance()

  const { theme, updateColor, resetColors } = useTheme()
  const [newCategory, setNewCategory] = useState('')
  const [cardForm, setCardForm] = useState(() => getCardDefaults(persons[0]?.id))
  const [showColorSettings, setShowColorSettings] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonAllowSplit, setNewPersonAllowSplit] = useState(false)
  const [newPersonSplitWithIds, setNewPersonSplitWithIds] = useState<number[]>([])
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null)
  const [editingPersonName, setEditingPersonName] = useState('')
  const [editingPersonAllowSplit, setEditingPersonAllowSplit] = useState(false)
  const [editingPersonSplitWithIds, setEditingPersonSplitWithIds] = useState<number[]>([])
  const [deletingPersonId, setDeletingPersonId] = useState<number | null>(null)
  const [deleteOption, setDeleteOption] = useState<'migrate' | 'delete'>('migrate')
  const [migrateToPersonId, setMigrateToPersonId] = useState<number | null>(null)

  const handleAddCategory = async () => {
    if (!newCategory || categories.includes(newCategory)) return
    await actions.saveCategories([...categories, newCategory])
    setNewCategory('')
  }

  const handleRemoveCategory = async (category: string) => {
    await actions.saveCategories(categories.filter((item) => item !== category))
  }

  const handleAddCard = async () => {
    if (!cardForm.name || !cardForm.limit || !cardForm.ownerId) return
    await actions.addCreditCard({
      name: cardForm.name,
      ownerId: cardForm.ownerId,
      closingDay: cardForm.closingDay,
      dueDay: cardForm.dueDay,
      limit: Number(cardForm.limit),
    })
    setCardForm(getCardDefaults(persons[0]?.id))
  }

  const handleAddPerson = async () => {
    if (!newPersonName.trim()) return
    await actions.createPerson({ 
      name: newPersonName.trim(), 
      allowSplit: newPersonAllowSplit,
      splitWithPersonIds: newPersonAllowSplit ? newPersonSplitWithIds : undefined
    })
    setNewPersonName('')
    setNewPersonAllowSplit(false)
    setNewPersonSplitWithIds([])
  }

  const handleStartEditPerson = (person: PersonType) => {
    setEditingPersonId(person.id)
    setEditingPersonName(person.name)
    setEditingPersonAllowSplit(person.allowSplit)
    setEditingPersonSplitWithIds(person.splitWithPersonIds || [])
  }

  const handleCancelEditPerson = () => {
    setEditingPersonId(null)
    setEditingPersonName('')
    setEditingPersonAllowSplit(false)
    setEditingPersonSplitWithIds([])
  }

  const handleSaveEditPerson = async () => {
    if (!editingPersonId || !editingPersonName.trim()) return
    await actions.updatePerson(editingPersonId, { 
      name: editingPersonName.trim(), 
      allowSplit: editingPersonAllowSplit,
      splitWithPersonIds: editingPersonAllowSplit ? editingPersonSplitWithIds : undefined
    })
    setEditingPersonId(null)
    setEditingPersonName('')
    setEditingPersonAllowSplit(false)
    setEditingPersonSplitWithIds([])
  }

  const handleStartDeletePerson = (person: PersonType) => {
    setDeletingPersonId(person.id)
    setDeleteOption('migrate')
    setMigrateToPersonId(persons.find(p => p.id !== person.id)?.id || null)
  }

  const handleCancelDeletePerson = () => {
    setDeletingPersonId(null)
    setDeleteOption('migrate')
    setMigrateToPersonId(null)
  }

  const handleConfirmDeletePerson = async () => {
    if (!deletingPersonId) return
    await actions.deletePerson(deletingPersonId, {
      migrateToPersonId: deleteOption === 'migrate' ? migrateToPersonId || undefined : undefined,
      deleteTransactions: deleteOption === 'delete',
    })
    setDeletingPersonId(null)
    setDeleteOption('migrate')
    setMigrateToPersonId(null)
  }

  useEffect(() => {
    if (persons.length > 0 && (!cardForm.ownerId || !persons.find(p => p.id === cardForm.ownerId))) {
      setCardForm(getCardDefaults(persons[0]?.id))
    }
  }, [persons])

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
        <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie pessoas, categorias e cartões de crédito utilizados no controle.</p>
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pessoas</h3>
        <div className="space-y-2">
          {persons.map((person) => (
            <div key={person.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-700/50">
              {editingPersonId === person.id ? (
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingPersonName}
                      onChange={(e) => setEditingPersonName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEditPerson}
                      className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={handleCancelEditPerson}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPersonAllowSplit}
                      onChange={(e) => {
                        setEditingPersonAllowSplit(e.target.checked)
                        if (!e.target.checked) {
                          setEditingPersonSplitWithIds([])
                        }
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span>Permitir divisão de lançamentos entre outras pessoas</span>
                  </label>
                  {editingPersonAllowSplit && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Dividir contas com:
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg p-2">
                        {persons.filter(p => p.active && p.id !== editingPersonId).map((person) => (
                          <label key={person.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={editingPersonSplitWithIds.includes(person.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingPersonSplitWithIds([...editingPersonSplitWithIds, person.id])
                                } else {
                                  setEditingPersonSplitWithIds(editingPersonSplitWithIds.filter(id => id !== person.id))
                                }
                              }}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{person.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-800 dark:text-gray-100 font-medium">{person.name}</span>
                    {person.allowSplit && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded w-fit">
                          Permite divisão
                        </span>
                        {person.splitWithPersonIds && person.splitWithPersonIds.length > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Divide com: {persons.filter(p => person.splitWithPersonIds?.includes(p.id)).map(p => p.name).join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditPerson(person)}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleStartDeletePerson(person)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPersonName}
              onChange={(event) => setNewPersonName(event.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPerson()}
              placeholder="Nome da pessoa"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button onClick={handleAddPerson} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
              Adicionar
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={newPersonAllowSplit}
              onChange={(e) => {
                setNewPersonAllowSplit(e.target.checked)
                if (!e.target.checked) {
                  setNewPersonSplitWithIds([])
                }
              }}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span>Permitir divisão de lançamentos entre outras pessoas</span>
          </label>
          {newPersonAllowSplit && (
            <div className="mt-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Dividir contas com:
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg p-2">
                {persons.filter(p => p.active).map((person) => (
                  <label key={person.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={newPersonSplitWithIds.includes(person.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPersonSplitWithIds([...newPersonSplitWithIds, person.id])
                        } else {
                          setNewPersonSplitWithIds(newPersonSplitWithIds.filter(id => id !== person.id))
                        }
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{person.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {deletingPersonId && (
          <div className="mt-4 p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-3">
              Ao excluir esta pessoa, o que deseja fazer com os lançamentos existentes?
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={deleteOption === 'migrate'}
                  onChange={() => setDeleteOption('migrate')}
                  className="text-red-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Migrar para outra pessoa</span>
              </label>
              {deleteOption === 'migrate' && (
                <select
                  value={migrateToPersonId || ''}
                  onChange={(e) => setMigrateToPersonId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Selecione uma pessoa</option>
                  {persons.filter(p => p.id !== deletingPersonId).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={deleteOption === 'delete'}
                  onChange={() => setDeleteOption('delete')}
                  className="text-red-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Apagar todos os lançamentos</span>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleConfirmDeletePerson}
                disabled={deleteOption === 'migrate' && !migrateToPersonId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar exclusão
              </button>
              <button
                onClick={handleCancelDeletePerson}
                className="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-lg hover:opacity-90 transition-opacity"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
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
              value={cardForm.ownerId}
              onChange={(event) => setCardForm({ ...cardForm, ownerId: Number(event.target.value) })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            >
              <option value="0">Selecione uma pessoa</option>
              {persons.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
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

