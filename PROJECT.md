# Finex — Definição do Projeto

Documento canônico para humanos e agentes de IA. Em caso de conflito com `README.md`, `ARCHITECTURE.md` ou `USAGE_EXAMPLES.md`, **este arquivo prevalece**.

---

## 1. O que é

**Finex** (`finance_controll`) é um app web de **controle financeiro pessoal/familiar**, focado em um casal (**Kaio** e **Gabriela**), com suporte a lançamentos compartilhados (**Ambos**).

É um SPA client-side: dados persistem no **localStorage** via camada de serviços (API mockada). Não há backend real ainda; a arquitetura prevê troca futura por API HTTP sem reescrever as views.

---

## 2. Para que serve

| Capacidade | Descrição |
|---|---|
| **Dashboard** | Visão do mês: saldo, receitas/despesas, gráficos, lembrete de poupança |
| **Transações** | CRUD de receitas/despesas, filtros, parcelas, cartão de crédito |
| **Fechamento** | Fecha/reabre competência (mês); mês fechado não deve permitir edição |
| **Orçamentos** | Limites por categoria/pessoa/mês e acompanhamento de gasto |
| **Poupança** | Metas, depósitos e acompanhamento de progresso |
| **Configurações** | Categorias, cartões de crédito e estatísticas do sistema |

**Competência** é sempre `MM/AAAA` (ex.: `01/2025`).

---

## 3. Stack

| Tecnologia | Uso |
|---|---|
| React 19 + TypeScript | UI e tipagem |
| Vite 7 | Build e dev server |
| Tailwind CSS 4 | Estilização |
| Recharts | Gráficos |
| Lucide React | Ícones |
| localStorage | Persistência atual (prefixo `finance_control_`) |

**Scripts:** `npm run dev` · `npm run build` · `npm run lint` · `npm run preview`

---

## 4. Arquitetura geral

Fluxo de dados (de cima para baixo):

```
Views (páginas)
  → Contexts (estado da feature + providers)
    → Hooks (lógica de negócio / estado assíncrono)
      → Services / apiService (CRUD + regras de persistência)
        → window.storage → LocalStorageService
```

### Camadas

1. **`src/views/`** — Telas por rota lógica (`DashboardView`, `TransactionsView`, etc.). Orquestram providers e UI; não falam direto com storage.
2. **`src/contexts/<feature>/`** — Provider + componentes da feature. Export público via `index.ts`.
3. **`src/hooks/`** — Encapsulam chamadas a `apiService`, loading/error e mutações. Preferir hooks a chamar serviços nas views.
4. **`src/services/api/`** — Repository por entidade (`*Service.ts`), herdam `BaseApiService`. Singleton: `apiService`.
5. **`src/services/storage/`** — Adapter de persistência; `main.tsx` expõe `window.storage` e inicializa mocks.
6. **`src/components/ui/`** — Componentes genéricos reutilizáveis (`Button`, `Card`, `PageHeader`, …).
7. **`src/design-system/`** — Cores e tokens de tema (`colors`, `theme`).
8. **`src/types/`** — Tipos de domínio compartilhados.

### Navegação

Não há React Router. `App.tsx` controla `activeView` (`ViewType`) e renderiza a view correspondente, além dos modais globais.

### Views existentes

`dashboard` · `transactions` · `closure` · `budget` · `savings` · `settings`

### Contexts existentes

`transactions` · `dashboard` · `budgets` · `savings` · `settings`

---

## 5. Domínio (regras de negócio)

### Pessoas

Valores canônicos: `'Kaio' | 'Gabriela' | 'Ambos'`.

Filtros de UI podem usar sentinelas como `'Todos'` / `'Todas'` — não confundir com o domínio persistido.

### Transação

- `type`: `'Despesa' | 'Receita'`
- `paymentMethod`: `'Crédito' | 'Débito' | 'Dinheiro' | 'PIX'`
- `competency`: mês de competência (`MM/AAAA`)
- Parcelas: `installments`, `installmentNumber`, opcionalmente `parentPurchase` / `totalInstallments`
- Crédito: `creditCard` = ID do cartão

### Orçamento

Por `competency` + `category` + `person` + `amount`. Gasto comparado gera `BudgetData` (`spent`, `difference`, `percentage`).

### Cartão

`name`, `owner`, `closingDay`, `dueDay`, `limit`.

### Meta de poupança

`targetAmount`, `currentAmount`, `deposits[]`, `owner`, `deadline` opcional.

### Fechamento de mês

Lista de competências em `closedMonths` (via `AppDataService` / `useAppData`). Mês fechado: bloquear edição de lançamentos.

### Respostas de API

Padrão `ApiResponse<T>`: `{ data, success, message? }`. Hooks/UI devem tratar `success === false`.

---

## 6. Regras para desenvolvimento (e para agentes)

### Obrigatórias

1. **Respeitar as camadas** — views não acessam `localStorage` nem `window.storage` diretamente; usam hooks/contexts/services.
2. **Tipos no domínio** — entidades e formulários em `src/types/index.ts`; tipos só de API em `src/services/api/types.ts`.
3. **UI reutilizável** — preferir `src/components/ui` e tokens de `design-system` a inventar estilos one-off.
4. **Feature nova** — seguir o checklist da seção 7; colocalizar componentes em `contexts/<feature>/components/`.
5. **Exports públicos** — expor via `index.ts` da feature/pasta; evitar imports profundos desnecessários.
6. **Idioma da UI** — textos de interface em **português**.
7. **Não expandir escopo** — não adicionar backend, auth, PWA, testes ou deps novas sem pedido explícito.
8. **Legado** — `src/financial_control_system.tsx` é monólito antigo (~2k linhas). **Não editar** para features novas; a base ativa é `App.tsx` + arquitetura por pastas. Remover só com pedido explícito.

### Preferências de código

- Componentes funcionais + TypeScript estrito.
- Hooks para lógica assíncrona (loading / error / mutações).
- Contextos **por feature**, no escopo da view/modal — evitar providers globais desnecessários em toda a árvore.
- Serviços herdam `BaseApiService` e usam `createSuccessResponse` / tratamento de erro padronizado.
- Tailwind para layout; cores semânticas via design system quando couber.
- Diff mínimo: só o necessário para a tarefa.

### Anti-padrões

- Duplicar lógica de CRUD na view em vez de hook/serviço.
- Hardcodar cores hex fora do design system sem motivo.
- Criar “god components” de centenas de linhas na view.
- Assumir backend HTTP — hoje tudo passa por storage local.
- Alterar `package.json` / configs de build sem necessidade clara.

---

## 7. Como adicionar uma feature

1. Tipos em `src/types/index.ts` (e API types se preciso).
2. Serviço em `src/services/api/<feature>Service.ts` + registro em `ApiService` / `index.ts`.
3. Hook em `src/hooks/use<Feature>.ts` + export em `hooks/index.ts`.
4. Contexto em `src/contexts/<feature>/` (Provider, components, `index.ts`).
5. View em `src/views/` se for tela nova; registrar em `views/index.ts` e em `App.tsx` (`ViewType` + switch + nav).
6. Persistência: chave no storage + seed em `storageInitializer` se houver dados iniciais.

---

## 8. Estrutura de pastas (referência)

```
src/
├── App.tsx                 # Shell: navegação, mês, filtros, modais
├── main.tsx                # Bootstrap storage + mocks + React root
├── views/                  # Telas
├── contexts/<feature>/     # Provider + components da feature
├── hooks/                  # Lógica reutilizável
├── services/
│   ├── api/                # Repositories + apiService
│   └── storage/            # localStorage + initializer
├── components/ui/          # Primitivos de UI
├── design-system/          # colors, theme
├── types/                  # Domínio
└── utils/                  # Utilitários pontuais
```

Detalhes de uso de hooks/contexts: ver `USAGE_EXAMPLES.md` (exemplos; regras de verdade estão aqui).

---

## 9. Estado atual e direção

**Já implementado:** dashboard, transações, fechamento, orçamentos, poupança, settings (categorias/cartões), persistência local, design system básico, UI kit.

**Direção futura (não implementar sem pedido):** backend real no lugar de `window.storage`, testes, tema escuro, validação de formulários mais robusta, cache, PWA, remoção do monólito legado.

---

## 10. Checklist rápido para o agente

Antes de mudar código:

- [ ] Qual feature / pasta é a dona dessa mudança?
- [ ] A alteração cabe em hook/serviço existente ou precisa de feature nova (seção 7)?
- [ ] Tipos de domínio atualizados?
- [ ] UI reutiliza `components/ui` e design system?
- [ ] Não toquei no legado `financial_control_system.tsx` sem necessidade?
- [ ] Resposta / commits / PRs em português quando for comunicação com o usuário?
