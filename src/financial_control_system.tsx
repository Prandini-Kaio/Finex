import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, Filter, Settings, FileText, Calendar, X, Edit2, Trash2, Download } from 'lucide-react';

const FinancialControl = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('10/2025');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([
    'Alimentação', 'Lazer', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Outros'
  ]);
  const [filters, setFilters] = useState({
    person: 'Todos',
    category: 'Todas',
    paymentType: 'Todos'
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Despesa',
    paymentMethod: 'Crédito',
    person: 'Kaio',
    category: 'Alimentação',
    description: '',
    value: '',
    competency: selectedMonth,
    creditCard: '',
    installments: '1',
    installmentNumber: 1
  });

  const [closedMonths, setClosedMonths] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    competency: selectedMonth,
    category: 'Alimentação',
    person: 'Kaio',
    amount: ''
  });
  const [creditCards, setCreditCards] = useState([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    name: '',
    owner: 'Kaio',
    closingDay: '5',
    dueDay: '15',
    limit: ''
  });
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [savingsForm, setSavingsForm] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    owner: 'Kaio',
    description: ''
  });
  const [depositForm, setDepositForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const txResult = await window.storage.get('transactions');
      const closedResult = await window.storage.get('closedMonths');
      const catResult = await window.storage.get('categories');
      const budgetResult = await window.storage.get('budgets');
      const cardsResult = await window.storage.get('creditCards');
      const savingsResult = await window.storage.get('savingsGoals');
      
      if (txResult) setTransactions(JSON.parse(txResult.value));
      if (closedResult) setClosedMonths(JSON.parse(closedResult.value));
      if (catResult) setCategories(JSON.parse(catResult.value));
      if (budgetResult) setBudgets(JSON.parse(budgetResult.value));
      if (cardsResult) setCreditCards(JSON.parse(cardsResult.value));
      if (savingsResult) setSavingsGoals(JSON.parse(savingsResult.value));
    } catch (error) {
      console.log('Primeira inicialização - dados não encontrados');
    }
  };

  const saveTransactions = async (newTransactions) => {
    try {
      await window.storage.set('transactions', JSON.stringify(newTransactions));
      setTransactions(newTransactions);
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
    }
  };

  const saveClosedMonths = async (newClosed) => {
    try {
      await window.storage.set('closedMonths', JSON.stringify(newClosed));
      setClosedMonths(newClosed);
    } catch (error) {
      console.error('Erro ao salvar fechamentos:', error);
    }
  };

  const saveCategories = async (newCategories) => {
    try {
      await window.storage.set('categories', JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error('Erro ao salvar categorias:', error);
    }
  };

  const saveBudgets = async (newBudgets) => {
    try {
      await window.storage.set('budgets', JSON.stringify(newBudgets));
      setBudgets(newBudgets);
    } catch (error) {
      console.error('Erro ao salvar orçamentos:', error);
    }
  };

  const saveCreditCards = async (newCards) => {
    try {
      await window.storage.set('creditCards', JSON.stringify(newCards));
      setCreditCards(newCards);
    } catch (error) {
      console.error('Erro ao salvar cartões:', error);
    }
  };

  const saveSavingsGoals = async (newGoals) => {
    try {
      await window.storage.set('savingsGoals', JSON.stringify(newGoals));
      setSavingsGoals(newGoals);
    } catch (error) {
      console.error('Erro ao salvar objetivos:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!formData.value || !formData.description) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.paymentMethod === 'Crédito' && !formData.creditCard) {
      alert('Selecione um cartão de crédito');
      return;
    }

    const installments = parseInt(formData.installments) || 1;
    const value = parseFloat(formData.value);
    const installmentValue = value / installments;

    // Se for parcelado, criar múltiplas transações
    if (installments > 1) {
      const newTransactions = [];
      const purchaseDate = new Date(formData.date);
      
      for (let i = 0; i < installments; i++) {
        const competencyDate = new Date(purchaseDate);
        competencyDate.setMonth(competencyDate.getMonth() + i);
        const competency = `${String(competencyDate.getMonth() + 1).padStart(2, '0')}/${competencyDate.getFullYear()}`;
        
        newTransactions.push({
          id: Date.now() + i,
          ...formData,
          value: installmentValue,
          competency,
          installmentNumber: i + 1,
          totalInstallments: installments,
          parentPurchase: Date.now()
        });
      }
      
      await saveTransactions([...transactions, ...newTransactions]);
    } else {
      const newTransaction = {
        id: Date.now(),
        ...formData,
        value,
        installments: 1,
        installmentNumber: 1
      };
      await saveTransactions([...transactions, newTransaction]);
    }

    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Despesa',
      paymentMethod: 'Crédito',
      person: 'Kaio',
      category: 'Alimentação',
      description: '',
      value: '',
      competency: selectedMonth,
      creditCard: '',
      installments: '1',
      installmentNumber: 1
    });
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Deseja realmente excluir esta transação?')) {
      await saveTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleAddBudget = async () => {
    if (!budgetForm.amount) {
      alert('Preencha o valor do orçamento');
      return;
    }

    const newBudget = {
      id: Date.now(),
      ...budgetForm,
      amount: parseFloat(budgetForm.amount)
    };

    await saveBudgets([...budgets, newBudget]);
    setShowBudgetModal(false);
    setBudgetForm({
      competency: selectedMonth,
      category: 'Alimentação',
      person: 'Kaio',
      amount: ''
    });
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Deseja realmente excluir este orçamento?')) {
      await saveBudgets(budgets.filter(b => b.id !== id));
    }
  };

  const handleAddCard = async () => {
    if (!cardForm.name || !cardForm.limit) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const newCard = {
      id: Date.now(),
      ...cardForm,
      limit: parseFloat(cardForm.limit)
    };

    await saveCreditCards([...creditCards, newCard]);
    setShowCardModal(false);
    setCardForm({
      name: '',
      owner: 'Kaio',
      closingDay: '5',
      dueDay: '15',
      limit: ''
    });
  };

  const handleDeleteCard = async (id) => {
    if (window.confirm('Deseja realmente excluir este cartão?')) {
      await saveCreditCards(creditCards.filter(c => c.id !== id));
    }
  };

  const handleAddSavingsGoal = async () => {
    if (!savingsForm.name || !savingsForm.targetAmount) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    const newGoal = {
      id: Date.now(),
      ...savingsForm,
      targetAmount: parseFloat(savingsForm.targetAmount),
      currentAmount: 0,
      deposits: [],
      createdAt: new Date().toISOString()
    };

    await saveSavingsGoals([...savingsGoals, newGoal]);
    setShowSavingsModal(false);
    setSavingsForm({
      name: '',
      targetAmount: '',
      deadline: '',
      owner: 'Kaio',
      description: ''
    });
  };

  const handleAddDeposit = async () => {
    if (!depositForm.amount || !selectedGoal) {
      alert('Preencha o valor do depósito');
      return;
    }

    const updatedGoals = savingsGoals.map(goal => {
      if (goal.id === selectedGoal.id) {
        const newDeposit = {
          id: Date.now(),
          amount: parseFloat(depositForm.amount),
          date: depositForm.date
        };
        return {
          ...goal,
          deposits: [...goal.deposits, newDeposit],
          currentAmount: goal.currentAmount + parseFloat(depositForm.amount)
        };
      }
      return goal;
    });

    await saveSavingsGoals(updatedGoals);
    setShowDepositModal(false);
    setSelectedGoal(null);
    setDepositForm({
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Deseja realmente excluir este objetivo?')) {
      await saveSavingsGoals(savingsGoals.filter(g => g.id !== id));
    }
  };

  const closeMonth = async () => {
    if (closedMonths.includes(selectedMonth)) {
      alert('Este mês já está fechado!');
      return;
    }
    if (window.confirm(`Deseja fechar o mês ${selectedMonth}? Não será possível editar os lançamentos.`)) {
      await saveClosedMonths([...closedMonths, selectedMonth]);
    }
  };

  const reopenMonth = async () => {
    if (window.confirm(`Deseja reabrir o mês ${selectedMonth}?`)) {
      await saveClosedMonths(closedMonths.filter(m => m !== selectedMonth));
    }
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const monthMatch = t.competency === selectedMonth;
      const personMatch = filters.person === 'Todos' || t.person === filters.person;
      const categoryMatch = filters.category === 'Todas' || t.category === filters.category;
      const paymentMatch = filters.paymentType === 'Todos' || t.paymentMethod === filters.paymentType;
      return monthMatch && personMatch && categoryMatch && paymentMatch;
    });
  };

  const getStats = () => {
    const filtered = getFilteredTransactions();
    const expenses = filtered.filter(t => t.type === 'Despesa').reduce((sum, t) => sum + t.value, 0);
    const income = filtered.filter(t => t.type === 'Receita').reduce((sum, t) => sum + t.value, 0);
    
    const byCategory = {};
    filtered.filter(t => t.type === 'Despesa').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.value;
    });

    const byPerson = {
      Kaio: filtered.filter(t => t.person === 'Kaio' && t.type === 'Despesa').reduce((sum, t) => sum + t.value, 0),
      Gabriela: filtered.filter(t => t.person === 'Gabriela' && t.type === 'Despesa').reduce((sum, t) => sum + t.value, 0),
      Ambos: filtered.filter(t => t.person === 'Ambos' && t.type === 'Despesa').reduce((sum, t) => sum + t.value, 0)
    };

    return { expenses, income, balance: income - expenses, byCategory, byPerson };
  };

  const stats = getStats();

  const COLORS = {
    Kaio: '#3b82f6',
    Gabriela: '#ec4899',
    Ambos: '#a855f7'
  };

  const CATEGORY_COLORS = ['#3b82f6', '#ec4899', '#a855f7', '#f59e0b', '#10b981', '#6366f1', '#ef4444'];

  const DashboardView = () => {
    const pieData = Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }));
    const barData = [
      { name: 'Kaio', value: stats.byPerson.Kaio },
      { name: 'Gabriela', value: stats.byPerson.Gabriela },
      { name: 'Ambos', value: stats.byPerson.Ambos }
    ];

    const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalGoals = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const savingsPercentage = totalGoals > 0 ? (totalSaved / totalGoals) * 100 : 0;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="MM/AAAA"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} /> Adicionar Lançamento
            </button>
          </div>
        </div>

        {closedMonths.includes(selectedMonth) && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            ✓ Mês {selectedMonth} já está fechado
          </div>
        )}

        {stats.income > 0 && savingsGoals.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">💡 Lembre-se de Poupar!</h3>
                <p className="text-lg opacity-90">
                  Você teve R$ {stats.income.toFixed(2)} de receita este mês. 
                  Que tal guardar pelo menos 10%? (R$ {(stats.income * 0.1).toFixed(2)})
                </p>
                <p className="text-sm mt-2 opacity-80">
                  Você tem {savingsGoals.length} objetivo(s) em andamento 🎯
                </p>
              </div>
              <button
                onClick={() => setActiveView('savings')}
                className="bg-white text-yellow-600 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-50"
              >
                Ver Objetivos
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-600">R$ {stats.expenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Receitas</p>
                <p className="text-2xl font-bold text-green-600">R$ {stats.income.toFixed(2)}</p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>

          <div className={`${stats.balance >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500'} border-l-4 p-6 rounded-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Saldo do Mês</p>
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  R$ {stats.balance.toFixed(2)}
                </p>
              </div>
              <DollarSign className={stats.balance >= 0 ? 'text-blue-500' : 'text-orange-500'} size={32} />
            </div>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Poupado</p>
                <p className="text-2xl font-bold text-purple-600">R$ {totalSaved.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{savingsPercentage.toFixed(1)}% da meta</p>
              </div>
              <div className="text-purple-500 text-3xl">🏦</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: R${entry.value.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-20">Nenhuma despesa registrada</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Despesas por Pessoa</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const TransactionsView = () => {
    const filtered = getFilteredTransactions();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Lançamentos</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Adicionar
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <select
              value={filters.person}
              onChange={(e) => setFilters({...filters, person: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            >
              <option>Todos</option>
              <option>Kaio</option>
              <option>Gabriela</option>
              <option>Ambos</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            >
              <option>Todas</option>
              {categories.map(cat => <option key={cat}>{cat}</option>)}
            </select>

            <select
              value={filters.paymentType}
              onChange={(e) => setFilters({...filters, paymentType: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            >
              <option>Todos</option>
              <option>Crédito</option>
              <option>Débito</option>
              <option>Dinheiro</option>
              <option>PIX</option>
            </select>

            <input
              type="text"
              placeholder="Competência (MM/AAAA)"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pessoa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoria</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Descrição</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pagamento</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Parcelas</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${t.type === 'Despesa' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs" style={{backgroundColor: `${COLORS[t.person]}20`, color: COLORS[t.person]}}>
                        {t.person}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{t.category}</td>
                    <td className="px-4 py-3 text-sm">{t.description}</td>
                    <td className="px-4 py-3 text-sm">
                      {t.paymentMethod === 'Crédito' && t.creditCard ? (
                        <div className="flex flex-col">
                          <span>{t.paymentMethod}</span>
                          <span className="text-xs text-gray-500">{creditCards.find(c => c.id === parseInt(t.creditCard))?.name || 'Cartão'}</span>
                        </div>
                      ) : (
                        t.paymentMethod
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {t.totalInstallments > 1 ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {t.installmentNumber}/{t.totalInstallments}x
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">À vista</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">R$ {t.value.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        disabled={closedMonths.includes(selectedMonth)}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center py-8 text-gray-400">Nenhum lançamento encontrado</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ClosureView = () => {
    const filtered = getFilteredTransactions();
    const kaioExpenses = filtered.filter(t => t.person === 'Kaio' && t.type === 'Despesa').reduce((s, t) => s + t.value, 0);
    const gabrielaExpenses = filtered.filter(t => t.person === 'Gabriela' && t.type === 'Despesa').reduce((s, t) => s + t.value, 0);
    const bothExpenses = filtered.filter(t => t.person === 'Ambos' && t.type === 'Despesa').reduce((s, t) => s + t.value, 0);
    
    const categoryData = {};
    categories.forEach(cat => {
      const kaio = filtered.filter(t => t.category === cat && t.person === 'Kaio' && t.type === 'Despesa').reduce((s, t) => s + t.value, 0);
      const gabriela = filtered.filter(t => t.category === cat && t.person === 'Gabriela' && t.type === 'Despesa').reduce((s, t) => s + t.value, 0);
      const both = filtered.filter(t => t.category === cat && t.person === 'Ambos' && t.type === 'Despesa').reduce((s, t) => s + t.value, 0);
      if (kaio > 0 || gabriela > 0 || both > 0) {
        categoryData[cat] = { kaio, gabriela, both, total: kaio + gabriela + both };
      }
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Fechamento</h1>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="MM/AAAA"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            {closedMonths.includes(selectedMonth) ? (
              <button onClick={reopenMonth} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                Reabrir Mês
              </button>
            ) : (
              <button onClick={closeMonth} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Fechar Mês
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Kaio</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Despesas:</span>
                <span className="font-semibold text-red-600">R$ {kaioExpenses.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-pink-500">
            <h3 className="text-lg font-semibold mb-4 text-pink-600">Gabriela</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Despesas:</span>
                <span className="font-semibold text-red-600">R$ {gabrielaExpenses.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
            <h3 className="text-lg font-semibold mb-4 text-purple-600">Ambos</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Despesas:</span>
                <span className="font-semibold text-red-600">R$ {bothExpenses.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoria</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-blue-600">Kaio</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-pink-600">Gabriela</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-purple-600">Ambos</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.entries(categoryData).map(([cat, data]) => (
                  <tr key={cat} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{cat}</td>
                    <td className="px-4 py-3 text-sm text-right">R$ {data.kaio.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">R$ {data.gabriela.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">R$ {data.both.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">R$ {data.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="px-4 py-3 text-sm">TOTAL</td>
                  <td className="px-4 py-3 text-sm text-right">R$ {kaioExpenses.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">R$ {gabrielaExpenses.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">R$ {bothExpenses.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">R$ {(kaioExpenses + gabrielaExpenses + bothExpenses).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const BudgetHealthView = () => {
    const filtered = getFilteredTransactions();
    const monthBudgets = budgets.filter(b => b.competency === selectedMonth);
    
    const budgetData = monthBudgets.map(budget => {
      const spent = filtered
        .filter(t => t.type === 'Despesa' && t.category === budget.category && t.person === budget.person)
        .reduce((sum, t) => sum + t.value, 0);
      
      const difference = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        ...budget,
        spent,
        difference,
        percentage
      };
    });

    const getHistoricalData = () => {
      const months = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        
        const monthTransactions = transactions.filter(t => t.competency === monthKey);
        const expenses = monthTransactions.filter(t => t.type === 'Despesa').reduce((sum, t) => sum + t.value, 0);
        const income = monthTransactions.filter(t => t.type === 'Receita').reduce((sum, t) => sum + t.value, 0);
        const monthBudget = budgets.filter(b => b.competency === monthKey).reduce((sum, b) => sum + b.amount, 0);
        
        months.push({
          month: monthKey,
          expenses,
          income,
          budget: monthBudget,
          balance: income - expenses
        });
      }
      
      return months;
    };

    const historicalData = getHistoricalData();

    const getBurndownData = () => {
      const monthTransactions = filtered.filter(t => t.type === 'Despesa').sort((a, b) => new Date(a.date) - new Date(b.date));
      const totalBudget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
      
      if (monthTransactions.length === 0 || totalBudget === 0) return [];
      
      let accumulated = 0;
      const data = monthTransactions.map((t, index) => {
        accumulated += t.value;
        const day = new Date(t.date).getDate();
        return {
          day,
          spent: accumulated,
          budget: totalBudget,
          remaining: totalBudget - accumulated
        };
      });
      
      return data;
    };

    const burndownData = getBurndownData();

    const getCategoryTrend = () => {
      const last3Months = [];
      const currentDate = new Date();
      
      for (let i = 2; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        
        const monthData = { month: monthKey };
        
        categories.forEach(cat => {
          const categoryExpenses = transactions
            .filter(t => t.competency === monthKey && t.category === cat && t.type === 'Despesa')
            .reduce((sum, t) => sum + t.value, 0);
          monthData[cat] = categoryExpenses;
        });
        
        last3Months.push(monthData);
      }
      
      return last3Months;
    };

    const categoryTrend = getCategoryTrend();

    const getHealthScore = () => {
      if (budgetData.length === 0) return { score: 0, label: 'Sem dados', color: 'gray' };
      
      const avgPercentage = budgetData.reduce((sum, b) => sum + b.percentage, 0) / budgetData.length;
      
      if (avgPercentage <= 70) return { score: avgPercentage, label: 'Excelente', color: 'green' };
      if (avgPercentage <= 90) return { score: avgPercentage, label: 'Bom', color: 'blue' };
      if (avgPercentage <= 100) return { score: avgPercentage, label: 'Atenção', color: 'yellow' };
      return { score: avgPercentage, label: 'Crítico', color: 'red' };
    };

    const healthScore = getHealthScore();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Planejamento & Saúde Financeira</h1>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="MM/AAAA"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              onClick={() => setShowBudgetModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus size={20} /> Definir Orçamento
            </button>
          </div>
        </div>

        <div className={`bg-gradient-to-r ${
          healthScore.color === 'green' ? 'from-green-500 to-green-600' :
          healthScore.color === 'blue' ? 'from-blue-500 to-blue-600' :
          healthScore.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
          healthScore.color === 'red' ? 'from-red-500 to-red-600' :
          'from-gray-500 to-gray-600'
        } text-white p-8 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Saúde Financeira: {healthScore.label}</h2>
              <p className="text-lg opacity-90">
                {budgetData.length > 0 
                  ? `Uso médio do orçamento: ${healthScore.score.toFixed(1)}%`
                  : 'Defina orçamentos para acompanhar sua saúde financeira'}
              </p>
            </div>
            <div className="text-6xl font-bold opacity-20">
              {healthScore.score > 0 ? `${healthScore.score.toFixed(0)}%` : '—'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Orçamentos do Mês - {selectedMonth}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Categoria</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pessoa</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Orçado</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Gasto Real</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Diferença</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">% Usado</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {budgetData.map(budget => (
                  <tr key={budget.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{budget.category}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs" style={{backgroundColor: `${COLORS[budget.person]}20`, color: COLORS[budget.person]}}>
                        {budget.person}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">R$ {budget.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">R$ {budget.spent.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${budget.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {budget.difference >= 0 ? '+' : ''}R$ {budget.difference.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{budget.percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              budget.percentage <= 70 ? 'bg-green-500' :
                              budget.percentage <= 90 ? 'bg-blue-500' :
                              budget.percentage <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{width: `${Math.min(budget.percentage, 100)}%`}}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {budgetData.length === 0 && (
              <p className="text-center py-8 text-gray-400">Nenhum orçamento definido para este mês</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Evolução Histórica (6 meses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Despesas" strokeWidth={2} />
                <Line type="monotone" dataKey="income" stroke="#10b981" name="Receitas" strokeWidth={2} />
                <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Orçamento" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Burndown do Mês</h3>
            {burndownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Dia do Mês', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="spent" stroke="#ef4444" name="Gasto Acumulado" strokeWidth={2} />
                  <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Orçamento Total" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-20">Dados insuficientes para gerar o gráfico</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Tendência por Categoria (3 meses)</h3>
            {categoryTrend.length > 0 && categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={categoryTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {categories.slice(0, 5).map((cat, index) => (
                    <Line
                      key={cat}
                      type="monotone"
                      dataKey={cat}
                      stroke={CATEGORY_COLORS[index]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-20">Dados insuficientes para gerar o gráfico</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h4 className="text-sm text-gray-600 mb-2">Orçamento Total</h4>
            <p className="text-2xl font-bold text-blue-600">
              R$ {monthBudgets.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <h4 className="text-sm text-gray-600 mb-2">Gasto Total</h4>
            <p className="text-2xl font-bold text-red-600">
              R$ {budgetData.reduce((sum, b) => sum + b.spent, 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h4 className="text-sm text-gray-600 mb-2">Economia Planejada</h4>
            <p className="text-2xl font-bold text-green-600">
              R$ {budgetData.reduce((sum, b) => sum + b.difference, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    const [newCategory, setNewCategory] = useState('');

    const handleAddCategory = async () => {
      if (newCategory && !categories.includes(newCategory)) {
        await saveCategories([...categories, newCategory]);
        setNewCategory('');
      }
    };

    const handleDeleteCategory = async (cat) => {
      if (window.confirm(`Deseja excluir a categoria "${cat}"?`)) {
        await saveCategories(categories.filter(c => c !== cat));
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Cartões de Crédito</h3>
            <button
              onClick={() => setShowCardModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <Plus size={20} /> Adicionar Cartão
            </button>
          </div>
          
          {creditCards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Titular</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Limite</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Dia Fechamento</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Dia Vencimento</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {creditCards.map(card => (
                    <tr key={card.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{card.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs" style={{backgroundColor: `${COLORS[card.owner]}20`, color: COLORS[card.owner]}}>
                          {card.owner}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">R$ {card.limit.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-center">{card.closingDay}</td>
                      <td className="px-4 py-3 text-sm text-center">{card.dueDay}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-red-600 hover:text-red-800"
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
            <p className="text-gray-400 text-center py-8">Nenhum cartão cadastrado</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Gerenciar Categorias</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nova categoria"
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={handleAddCategory}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <span>{cat}</span>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Dados do Sistema</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Total de transações: {transactions.length}</p>
            <p>Meses fechados: {closedMonths.length}</p>
            <p>Categorias cadastradas: {categories.length}</p>
            <p>Orçamentos definidos: {budgets.length}</p>
            <p>Cartões cadastrados: {creditCards.length}</p>
            <p>Objetivos de poupança: {savingsGoals.length}</p>
          </div>
        </div>
      </div>
    );
  };

  const SavingsView = () => {
    const getSavingsTrend = () => {
      const last6Months = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        
        let monthSavings = 0;
        savingsGoals.forEach(goal => {
          const monthDeposits = goal.deposits.filter(d => {
            const depositDate = new Date(d.date);
            const depositMonth = `${String(depositDate.getMonth() + 1).padStart(2, '0')}/${depositDate.getFullYear()}`;
            return depositMonth === monthKey;
          });
          monthSavings += monthDeposits.reduce((sum, d) => sum + d.amount, 0);
        });
        
        last6Months.push({
          month: monthKey,
          saved: monthSavings
        });
      }
      
      return last6Months;
    };

    const savingsTrend = getSavingsTrend();
    const avgMonthlySavings = savingsTrend.reduce((sum, m) => sum + m.saved, 0) / savingsTrend.length;
    
    const getProjection = (goal) => {
      if (goal.currentAmount >= goal.targetAmount) return { months: 0, status: 'completed' };
      if (!goal.deadline) return { months: null, status: 'no-deadline' };
      
      const remaining = goal.targetAmount - goal.currentAmount;
      const monthsToDeadline = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30));
      const neededPerMonth = remaining / monthsToDeadline;
      
      if (avgMonthlySavings >= neededPerMonth) {
        return { months: Math.ceil(remaining / avgMonthlySavings), status: 'on-track' };
      } else {
        return { months: monthsToDeadline, status: 'behind', neededPerMonth };
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">💰 Poupança & Investimentos</h1>
          <button
            onClick={() => setShowSavingsModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus size={20} /> Novo Objetivo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Total Guardado</h3>
            <p className="text-3xl font-bold">R$ {savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0).toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Média Mensal</h3>
            <p className="text-3xl font-bold">R$ {avgMonthlySavings.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Objetivos Ativos</h3>
            <p className="text-3xl font-bold">{savingsGoals.filter(g => g.currentAmount < g.targetAmount).length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Evolução da Poupança (6 meses)</h3>
          {savingsTrend.some(m => m.saved > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={savingsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="saved" stroke="#10b981" name="Guardado no Mês" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-20">Nenhum depósito realizado ainda</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savingsGoals.map(goal => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const projection = getProjection(goal);
            
            return (
              <div key={goal.id} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{goal.name}</h3>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-2 inline-block">
                      {goal.owner}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progresso</span>
                    <span className="font-semibold">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all"
                      style={{width: `${Math.min(percentage, 100)}%`}}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-1 text-gray-600">
                    <span>R$ {goal.currentAmount.toFixed(2)}</span>
                    <span>R$ {goal.targetAmount.toFixed(2)}</span>
                  </div>
                </div>

                {goal.deadline && (
                  <div className="mb-4 text-sm text-gray-600">
                    <p>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}

                {projection.status === 'on-track' && projection.months > 0 && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm mb-4">
                    ✓ No ritmo atual, você atingirá a meta em {projection.months} meses!
                  </div>
                )}

                {projection.status === 'behind' && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded text-sm mb-4">
                    ⚠️ Você precisa guardar R$ {projection.neededPerMonth.toFixed(2)}/mês para atingir a meta no prazo
                  </div>
                )}

                {projection.status === 'completed' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm mb-4">
                    🎉 Parabéns! Você atingiu sua meta!
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedGoal(goal);
                    setShowDepositModal(true);
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Adicionar Depósito
                </button>

                {goal.deposits.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Últimos Depósitos:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {goal.deposits.slice(-5).reverse().map(deposit => (
                        <div key={deposit.id} className="flex justify-between text-sm text-gray-600">
                          <span>{new Date(deposit.date).toLocaleDateString('pt-BR')}</span>
                          <span className="font-semibold text-green-600">+R$ {deposit.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {savingsGoals.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Crie seu primeiro objetivo!</h3>
            <p className="text-gray-600 mb-6">Defina metas de poupança e acompanhe seu progresso</p>
            <button
              onClick={() => setShowSavingsModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Começar Agora
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">💰 Controle Financeiro</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-lg ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('transactions')}
                className={`px-4 py-2 rounded-lg ${activeView === 'transactions' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Lançamentos
              </button>
              <button
                onClick={() => setActiveView('closure')}
                className={`px-4 py-2 rounded-lg ${activeView === 'closure' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Fechamento
              </button>
              <button
                onClick={() => setActiveView('budget')}
                className={`px-4 py-2 rounded-lg ${activeView === 'budget' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Planejamento
              </button>
              <button
                onClick={() => setActiveView('savings')}
                className={`px-4 py-2 rounded-lg ${activeView === 'savings' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Poupança
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className={`px-4 py-2 rounded-lg ${activeView === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'transactions' && <TransactionsView />}
        {activeView === 'closure' && <ClosureView />}
        {activeView === 'budget' && <BudgetHealthView />}
        {activeView === 'savings' && <SavingsView />}
        {activeView === 'settings' && <SettingsView />}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Novo Lançamento</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
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
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, person: e.target.value})}
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
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTransaction}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Definir Orçamento</h2>
              <button onClick={() => setShowBudgetModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competência (MM/AAAA)</label>
                <input
                  type="text"
                  value={budgetForm.competency}
                  onChange={(e) => setBudgetForm({...budgetForm, competency: e.target.value})}
                  placeholder="10/2025"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({...budgetForm, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {categories.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa</label>
                <select
                  value={budgetForm.person}
                  onChange={(e) => setBudgetForm({...budgetForm, person: e.target.value})}
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
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm({...budgetForm, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddBudget}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Salvar Orçamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Novo Cartão de Crédito</h2>
              <button onClick={() => setShowCardModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({...cardForm, name: e.target.value})}
                  placeholder="Ex: Nubank, Inter, C6..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titular</label>
                <select
                  value={cardForm.owner}
                  onChange={(e) => setCardForm({...cardForm, owner: e.target.value})}
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
                  value={cardForm.closingDay}
                  onChange={(e) => setCardForm({...cardForm, closingDay: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={cardForm.dueDay}
                  onChange={(e) => setCardForm({...cardForm, dueDay: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cardForm.limit}
                  onChange={(e) => setCardForm({...cardForm, limit: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowCardModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCard}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Salvar Cartão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSavingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Novo Objetivo de Poupança</h2>
              <button onClick={() => setShowSavingsModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Objetivo</label>
                <input
                  type="text"
                  value={savingsForm.name}
                  onChange={(e) => setSavingsForm({...savingsForm, name: e.target.value})}
                  placeholder="Ex: Viagem, Carro, Emergência..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={savingsForm.description}
                  onChange={(e) => setSavingsForm({...savingsForm, description: e.target.value})}
                  placeholder="Detalhes sobre o objetivo"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Meta (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={savingsForm.targetAmount}
                  onChange={(e) => setSavingsForm({...savingsForm, targetAmount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (Opcional)</label>
                <input
                  type="date"
                  value={savingsForm.deadline}
                  onChange={(e) => setSavingsForm({...savingsForm, deadline: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <select
                  value={savingsForm.owner}
                  onChange={(e) => setSavingsForm({...savingsForm, owner: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option>Kaio</option>
                  <option>Gabriela</option>
                  <option>Ambos</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowSavingsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSavingsGoal}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Criar Objetivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDepositModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Adicionar Depósito</h2>
              <button onClick={() => { setShowDepositModal(false); setSelectedGoal(null); }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Objetivo: <span className="font-semibold">{selectedGoal.name}</span></p>
              <p className="text-sm text-gray-600">Saldo Atual: <span className="font-semibold text-green-600">R$ {selectedGoal.currentAmount.toFixed(2)}</span></p>
              <p className="text-sm text-gray-600">Meta: <span className="font-semibold">R$ {selectedGoal.targetAmount.toFixed(2)}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Depósito (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border rounded-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Depósito</label>
                <input
                  type="date"
                  value={depositForm.date}
                  onChange={(e) => setDepositForm({...depositForm, date: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {depositForm.amount && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-700">
                  Novo saldo: R$ {(selectedGoal.currentAmount + parseFloat(depositForm.amount || 0)).toFixed(2)} ({((selectedGoal.currentAmount + parseFloat(depositForm.amount || 0)) / selectedGoal.targetAmount * 100).toFixed(1)}% da meta)
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => { setShowDepositModal(false); setSelectedGoal(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddDeposit}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar Depósito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialControl;