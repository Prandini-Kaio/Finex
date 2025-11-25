import { useMemo, useState } from 'react'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import type { Investment, InvestmentPayload, InvestmentType, Person } from '../types/finance'

const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  TESOURO_DIRETO: 'Tesouro Direto',
  CDB: 'CDB',
  POUPANCA: 'Poupança',
  LCI: 'LCI',
  LCA: 'LCA',
  FUNDO_INVESTIMENTO: 'Fundo de Investimento',
  ACAO: 'Ação',
  FII: 'FII',
  OUTROS: 'Outros',
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316']

interface InvestmentsViewProps {}

export const InvestmentsView: React.FC<InvestmentsViewProps> = () => {
  const {
    state: { investments },
    actions,
  } = useFinance()

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<InvestmentPayload>({
    name: '',
    type: 'TESOURO_DIRETO',
    owner: 'Kaio',
    investedAmount: 0,
    investmentDate: new Date().toISOString().split('T')[0],
    annualRate: undefined,
    currentValue: undefined,
    description: '',
    institution: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Cálculos e estatísticas
  const totalInvested = useMemo(() => {
    return investments.reduce((sum, inv) => sum + inv.investedAmount, 0)
  }, [investments])

  const totalCurrentValue = useMemo(() => {
    return investments.reduce((sum, inv) => sum + (inv.currentValue || inv.investedAmount), 0)
  }, [investments])

  const totalProfit = useMemo(() => {
    return totalCurrentValue - totalInvested
  }, [totalCurrentValue, totalInvested])

  const totalProfitPercentage = useMemo(() => {
    return totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(2) : '0.00'
  }, [totalProfit, totalInvested])

  const totalByType = useMemo(() => {
    return investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.investedAmount
      return acc
    }, {} as Record<InvestmentType, number>)
  }, [investments])

  const totalByOwner = useMemo(() => {
    return investments.reduce((acc, inv) => {
      acc[inv.owner] = (acc[inv.owner] || 0) + inv.investedAmount
      return acc
    }, {} as Record<Person, number>)
  }, [investments])

  // Dados para gráficos
  const typeChartData = useMemo(() => {
    return Object.entries(totalByType).map(([type, value]) => ({
      name: INVESTMENT_TYPE_LABELS[type as InvestmentType],
      value: Number(value.toFixed(2)),
    }))
  }, [totalByType])

  const ownerChartData = useMemo(() => {
    return Object.entries(totalByOwner).map(([owner, value]) => ({
      name: owner,
      value: Number(value.toFixed(2)),
    }))
  }, [totalByOwner])

  const evolutionChartData = useMemo(() => {
    const sorted = [...investments].sort(
      (a, b) => new Date(a.investmentDate).getTime() - new Date(b.investmentDate).getTime(),
    )
    let cumulative = 0
    return sorted.map((inv) => {
      cumulative += inv.investedAmount
      return {
        date: new Date(inv.investmentDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        invested: cumulative,
        current: cumulative + (inv.currentValue ? inv.currentValue - inv.investedAmount : 0),
      }
    })
  }, [investments])

  // Cálculo de rentabilidade estimada baseado na taxa anual
  const calculateEstimatedValue = (invested: number, rate: number | undefined, date: string): number => {
    if (!rate) return invested
    const investmentDate = new Date(date)
    const today = new Date()
    const years = (today.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    return invested * Math.pow(1 + rate / 100, years)
  }

  const handleOpenModal = () => {
    setEditingId(null)
    setForm({
      name: '',
      type: 'TESOURO_DIRETO',
      owner: 'Kaio',
      investedAmount: 0,
      investmentDate: new Date().toISOString().split('T')[0],
      annualRate: undefined,
      currentValue: undefined,
      description: '',
      institution: '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleEdit = (investment: Investment) => {
    setEditingId(investment.id)
    setForm({
      name: investment.name,
      type: investment.type,
      owner: investment.owner,
      investedAmount: investment.investedAmount,
      investmentDate: investment.investmentDate,
      annualRate: investment.annualRate,
      currentValue: investment.currentValue,
      description: investment.description || '',
      institution: investment.institution || '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!form.name || form.name.trim().length === 0) {
      errors.name = 'Nome do investimento é obrigatório'
    }
    
    if (!form.investedAmount || form.investedAmount <= 0) {
      errors.investedAmount = 'Valor investido deve ser maior que zero'
    }
    
    if (!form.investmentDate) {
      errors.investmentDate = 'Data do investimento é obrigatória'
    } else {
      const investmentDate = new Date(form.investmentDate)
      const today = new Date()
      if (investmentDate > today) {
        errors.investmentDate = 'Data não pode ser futura'
      }
    }
    
    if (form.annualRate !== undefined && (form.annualRate < 0 || form.annualRate > 100)) {
      errors.annualRate = 'Taxa anual deve estar entre 0% e 100%'
    }
    
    if (form.currentValue !== undefined && form.currentValue < 0) {
      errors.currentValue = 'Valor atual não pode ser negativo'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      if (editingId) {
        await actions.updateInvestment(editingId, form)
      } else {
        await actions.addInvestment(form)
      }
      setShowModal(false)
      setEditingId(null)
      setFormErrors({})
    } catch (error) {
      console.error('Erro ao salvar investimento:', error)
      alert('Erro ao salvar investimento. Verifique o console para mais detalhes.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) return

    try {
      await actions.deleteInvestment(id)
    } catch (error) {
      console.error('Erro ao excluir investimento:', error)
      alert('Erro ao excluir investimento. Verifique o console para mais detalhes.')
    }
  }

  const estimatedValue = useMemo(() => {
    if (!form.annualRate || !form.investedAmount || !form.investmentDate) return undefined
    return calculateEstimatedValue(form.investedAmount, form.annualRate, form.investmentDate)
  }, [form.annualRate, form.investedAmount, form.investmentDate])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Investimentos</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} /> Novo Investimento
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Investido</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                R$ {totalInvested.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Atual</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                R$ {totalCurrentValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${totalProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {totalProfit >= 0 ? (
                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              ) : (
                <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lucro/Prejuízo</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                R$ {totalProfit.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{totalProfitPercentage}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Investimentos</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{investments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Distribuição por Tipo */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Distribuição por Tipo
            </h3>
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
            )}
          </div>

          {/* Gráfico de Barras - Distribuição por Proprietário */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Distribuição por Proprietário
            </h3>
            {ownerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ownerChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
            )}
          </div>

          {/* Gráfico de Linha - Evolução Temporal */}
          {evolutionChartData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Evolução dos Investimentos
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="invested" stroke="#3b82f6" name="Valor Investido" />
                  <Line type="monotone" dataKey="current" stroke="#10b981" name="Valor Atual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tabela de Investimentos */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
        {investments.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum investimento cadastrado</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Clique em "Novo Investimento" para começar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Proprietário
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Valor Investido
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Valor Atual
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Rentabilidade
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {investments.map((investment) => {
                  const current = investment.currentValue || investment.investedAmount
                  const profit = current - investment.investedAmount
                  const profitPercent = investment.investedAmount > 0 
                    ? ((profit / investment.investedAmount) * 100).toFixed(2) 
                    : '0.00'
                  
                  return (
                    <tr key={investment.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">
                        {investment.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {INVESTMENT_TYPE_LABELS[investment.type]}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {investment.owner}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                        R$ {investment.investedAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                        R$ {current.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)} ({profitPercent}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(investment.investmentDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(investment)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="Editar investimento"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(investment.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Excluir investimento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-slate-700 border-t-2 border-gray-300 dark:border-slate-600">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-gray-800 dark:text-gray-200">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                    R$ {totalInvested.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                    R$ {totalCurrentValue.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {totalProfit >= 0 ? '+' : ''}R$ {totalProfit.toFixed(2)} ({totalProfitPercentage}%)
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {editingId ? 'Editar Investimento' : 'Novo Investimento'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Nome do Investimento *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value })
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
                  }}
                  className={`mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  }`}
                  placeholder="Ex: Tesouro IPCA 2029"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo *
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as InvestmentType })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.entries(INVESTMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Proprietário *
                <select
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value as Person })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Kaio">Kaio</option>
                  <option value="Gabriela">Gabriela</option>
                  <option value="Ambos">Ambos</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor Investido (R$) *
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.investedAmount || ''}
                  onChange={(e) => {
                    setForm({ ...form, investedAmount: Number(e.target.value) })
                    if (formErrors.investedAmount) setFormErrors({ ...formErrors, investedAmount: '' })
                  }}
                  className={`mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.investedAmount ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                {formErrors.investedAmount && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.investedAmount}</p>
                )}
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data do Investimento *
                <input
                  type="date"
                  value={form.investmentDate}
                  onChange={(e) => {
                    setForm({ ...form, investmentDate: e.target.value })
                    if (formErrors.investmentDate) setFormErrors({ ...formErrors, investmentDate: '' })
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className={`mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.investmentDate ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
                {formErrors.investmentDate && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.investmentDate}</p>
                )}
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Taxa Anual (%)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.annualRate || ''}
                  onChange={(e) => {
                    setForm({ ...form, annualRate: e.target.value ? Number(e.target.value) : undefined })
                    if (formErrors.annualRate) setFormErrors({ ...formErrors, annualRate: '' })
                  }}
                  className={`mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.annualRate ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  }`}
                  placeholder="Opcional"
                />
                {formErrors.annualRate && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.annualRate}</p>
                )}
                {estimatedValue && form.annualRate && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    Valor estimado: R$ {estimatedValue.toFixed(2)}
                  </p>
                )}
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor Atual (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.currentValue || ''}
                  onChange={(e) => {
                    setForm({ ...form, currentValue: e.target.value ? Number(e.target.value) : undefined })
                    if (formErrors.currentValue) setFormErrors({ ...formErrors, currentValue: '' })
                  }}
                  className={`mt-1 w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.currentValue ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                  }`}
                  placeholder="Opcional - valor atual do investimento"
                />
                {formErrors.currentValue && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.currentValue}</p>
                )}
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Instituição
                <input
                  type="text"
                  value={form.institution || ''}
                  onChange={(e) => setForm({ ...form, institution: e.target.value || undefined })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: Banco X, Corretora Y"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Descrição
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value || undefined })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Observações sobre o investimento (opcional)"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingId(null)
                  setFormErrors({})
                }}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                {editingId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
