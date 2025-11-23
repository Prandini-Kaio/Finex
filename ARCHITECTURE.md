# Arquitetura do Sistema de Controle Financeiro

## Visão Geral

Este projeto foi refatorado para seguir uma arquitetura robusta e escalável baseada em contextos/features, com separação clara de responsabilidades e padrões de desenvolvimento modernos.

## Estrutura de Pastas

```
src/
├── design-system/          # Sistema de design centralizado
│   ├── colors.ts          # Paleta de cores
│   ├── theme.ts           # Configurações de tema
│   └── index.ts           # Exports do design system
├── types/                 # Definições de tipos TypeScript
│   ├── index.ts           # Tipos principais
│   └── global.d.ts        # Declarações globais
├── services/              # Camada de serviços
│   └── api/               # Serviços da API
│       ├── base.ts        # Classe base para serviços
│       ├── types.ts       # Tipos específicos da API
│       ├── mockData.ts    # Dados mockados
│       ├── *Service.ts    # Implementações dos serviços
│       └── index.ts       # Exports dos serviços
├── hooks/                 # Hooks customizados
│   ├── useTransactions.ts
│   ├── useBudgets.ts
│   ├── useCreditCards.ts
│   ├── useSavingsGoals.ts
│   ├── useCategories.ts
│   ├── useAppData.ts
│   └── index.ts
├── contexts/              # Contextos por feature
│   ├── transactions/      # Contexto de transações
│   │   ├── TransactionContext.tsx
│   │   ├── components/    # Componentes específicos
│   │   └── index.ts
│   ├── dashboard/         # Contexto do dashboard
│   │   ├── DashboardContext.tsx
│   │   ├── components/    # Componentes específicos
│   │   └── index.ts
│   └── ...               # Outros contextos
├── App.tsx               # Componente principal
└── main.tsx              # Ponto de entrada
```

## Padrões Implementados

### 1. Design System Centralizado

- **Cores**: Paleta centralizada em `src/design-system/colors.ts`
- **Tema**: Configurações de espaçamento, tipografia, etc. em `src/design-system/theme.ts`
- **Facilidade de manutenção**: Mudanças de cor/tema em um local só

### 2. Arquitetura por Contextos

Cada feature principal tem seu próprio contexto:
- **Transactions**: Gerencia transações financeiras
- **Dashboard**: Gerencia dados do dashboard
- **Budgets**: Gerencia orçamentos (em desenvolvimento)
- **Savings**: Gerencia objetivos de poupança (em desenvolvimento)

### 3. Camada de Serviços

- **API Mockada**: Implementação completa com dados simulados
- **Padrão Repository**: Cada entidade tem seu serviço
- **Tratamento de Erros**: Padronizado em toda a aplicação
- **Simulação de Rede**: Delays realistas para desenvolvimento

### 4. Hooks Customizados

- **Separação de Lógica**: Lógica de negócio isolada dos componentes
- **Reutilização**: Hooks podem ser usados em diferentes contextos
- **Estado Gerenciado**: Cada hook gerencia seu próprio estado

### 5. Tipagem TypeScript

- **Tipos Robustos**: Definições completas para todas as entidades
- **IntelliSense**: Melhor experiência de desenvolvimento
- **Segurança**: Prevenção de erros em tempo de compilação

## Benefícios da Arquitetura

### Escalabilidade
- Fácil adição de novas features
- Contextos isolados evitam conflitos
- Serviços modulares

### Manutenibilidade
- Código organizado por responsabilidade
- Design system centralizado
- Padrões consistentes

### Testabilidade
- Hooks isolados são fáceis de testar
- Serviços mockados facilitam testes
- Componentes pequenos e focados

### Performance
- Lazy loading de contextos
- Hooks otimizados com useCallback
- Re-renders minimizados

## Como Adicionar uma Nova Feature

1. **Criar Contexto**: `src/contexts/nova-feature/`
2. **Implementar Serviço**: `src/services/api/novaFeatureService.ts`
3. **Criar Hook**: `src/hooks/useNovaFeature.ts`
4. **Definir Tipos**: Adicionar em `src/types/index.ts`
5. **Implementar Componentes**: Dentro do contexto

## Próximos Passos

- [ ] Implementar contexto de orçamentos
- [ ] Implementar contexto de poupança
- [ ] Adicionar testes unitários
- [ ] Implementar tema escuro
- [ ] Adicionar validação de formulários
- [ ] Implementar cache de dados
- [ ] Adicionar PWA capabilities

## Tecnologias Utilizadas

- **React 18** com TypeScript
- **Recharts** para gráficos
- **Lucide React** para ícones
- **Tailwind CSS** para estilização
- **Vite** como bundler
