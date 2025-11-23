# Exemplos de Uso da Nova Arquitetura

## Como Usar os Contextos

### 1. Usando o Contexto de Transações

```tsx
import { TransactionProvider, useTransactionContext } from './contexts/transactions';

function MyComponent() {
  return (
    <TransactionProvider filters={{ competency: '01/2025' }}>
      <TransactionList />
    </TransactionProvider>
  );
}

function TransactionList() {
  const { transactions, loading, addTransaction } = useTransactionContext();
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div>
      {transactions.map(transaction => (
        <div key={transaction.id}>
          {transaction.description} - R$ {transaction.value}
        </div>
      ))}
    </div>
  );
}
```

### 2. Usando o Contexto do Dashboard

```tsx
import { DashboardProvider, useDashboardContext } from './contexts/dashboard';

function Dashboard() {
  return (
    <DashboardProvider selectedMonth="01/2025">
      <DashboardContent />
    </DashboardProvider>
  );
}

function DashboardContent() {
  const { stats, totalSaved, loading } = useDashboardContext();
  
  if (loading) return <div>Carregando dashboard...</div>;
  
  return (
    <div>
      <h2>Saldo: R$ {stats?.balance.toFixed(2)}</h2>
      <h2>Poupado: R$ {totalSaved.toFixed(2)}</h2>
    </div>
  );
}
```

## Como Usar os Hooks

### 1. Hook de Transações

```tsx
import { useTransactions } from './hooks';

function MyComponent() {
  const { 
    transactions, 
    stats, 
    loading, 
    addTransaction, 
    deleteTransaction 
  } = useTransactions({ 
    competency: '01/2025',
    person: 'Kaio' 
  });

  const handleAddTransaction = async () => {
    const result = await addTransaction({
      date: '2025-01-15',
      type: 'Despesa',
      paymentMethod: 'Crédito',
      person: 'Kaio',
      category: 'Alimentação',
      description: 'Compras no mercado',
      value: 150.50,
      competency: '01/2025',
      installments: 1,
      installmentNumber: 1
    });

    if (result.success) {
      console.log('Transação criada!');
    } else {
      console.error('Erro:', result.error);
    }
  };

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {transactions.map(t => (
        <div key={t.id}>{t.description}</div>
      ))}
      <button onClick={handleAddTransaction}>Adicionar</button>
    </div>
  );
}
```

### 2. Hook de Categorias

```tsx
import { useCategories } from './hooks';

function CategoryManager() {
  const { 
    categories, 
    loading, 
    addCategory, 
    deleteCategory 
  } = useCategories();

  const handleAddCategory = async (name: string) => {
    const result = await addCategory(name);
    if (result.success) {
      console.log('Categoria adicionada!');
    }
  };

  return (
    <div>
      <h3>Categorias</h3>
      {categories.map(cat => (
        <div key={cat}>
          {cat}
          <button onClick={() => deleteCategory(cat)}>Excluir</button>
        </div>
      ))}
    </div>
  );
}
```

## Como Usar os Serviços

### 1. Serviço de Transações

```tsx
import { apiService } from './services/api';

async function example() {
  // Buscar todas as transações
  const response = await apiService.transactions.getAll({
    competency: '01/2025',
    person: 'Kaio'
  });

  if (response.success) {
    console.log('Transações:', response.data);
  }

  // Criar nova transação
  const newTransaction = await apiService.transactions.create({
    date: '2025-01-15',
    type: 'Despesa',
    paymentMethod: 'Crédito',
    person: 'Kaio',
    category: 'Alimentação',
    description: 'Compras no mercado',
    value: 150.50,
    competency: '01/2025',
    installments: 1,
    installmentNumber: 1
  });

  if (newTransaction.success) {
    console.log('Transação criada:', newTransaction.data);
  }
}
```

## Como Usar o Design System

### 1. Usando Cores

```tsx
import { colors } from './design-system';

function MyComponent() {
  return (
    <div style={{ 
      backgroundColor: colors.primary[500],
      color: colors.text.inverse 
    }}>
      <h1 style={{ color: colors.person.kaio }}>
        Título
      </h1>
    </div>
  );
}
```

### 2. Usando Tema

```tsx
import { theme } from './design-system';

function MyComponent() {
  return (
    <div style={{
      padding: theme.spacing.lg,
      fontSize: theme.fontSize.lg,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.boxShadow.md
    }}>
      Conteúdo
    </div>
  );
}
```

## Padrões Recomendados

### 1. Estrutura de Componentes

```tsx
// ✅ Bom: Componente pequeno e focado
function TransactionItem({ transaction }: { transaction: Transaction }) {
  return (
    <div className="transaction-item">
      <span>{transaction.description}</span>
      <span>R$ {transaction.value}</span>
    </div>
  );
}

// ❌ Ruim: Componente muito grande
function TransactionPage() {
  // 500+ linhas de código
}
```

### 2. Uso de Contextos

```tsx
// ✅ Bom: Contexto específico para a feature
function TransactionPage() {
  return (
    <TransactionProvider filters={{ competency: '01/2025' }}>
      <TransactionList />
      <TransactionForm />
    </TransactionProvider>
  );
}

// ❌ Ruim: Contexto global desnecessário
function App() {
  return (
    <TransactionProvider>
      <DashboardProvider>
        <BudgetProvider>
          {/* Todos os componentes aqui */}
        </BudgetProvider>
      </DashboardProvider>
    </TransactionProvider>
  );
}
```

### 3. Tratamento de Erros

```tsx
// ✅ Bom: Tratamento de erro no hook
function MyComponent() {
  const { transactions, error, loading } = useTransactions();

  if (error) {
    return <div className="error">Erro: {error}</div>;
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return <div>{/* Conteúdo */}</div>;
}
```
