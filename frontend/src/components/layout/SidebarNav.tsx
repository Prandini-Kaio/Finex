import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Repeat,
  Lock,
  PieChart,
  PiggyBank,
  TrendingUp,
  Landmark,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface SidebarNavProps {
  collapsed: boolean
  onToggle: () => void
}

const navGroups = [
  {
    label: 'Visão geral',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Movimentação',
    items: [
      { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
      { to: '/fixos', label: 'Lançamentos Fixos', icon: Repeat },
      { to: '/fechamento', label: 'Fechamento', icon: Lock },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { to: '/orcamento', label: 'Planejamento', icon: PieChart },
      { to: '/poupanca', label: 'Poupança', icon: PiggyBank },
      { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
    ],
  },
  {
    label: 'Configuração',
    items: [
      { to: '/contas', label: 'Contas', icon: Landmark },
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

export const SidebarNav: React.FC<SidebarNavProps> = ({ collapsed, onToggle }) => (
  <aside
    className={`flex flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-200 ${
      collapsed ? 'w-16' : 'w-64'
    }`}
  >
    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-slate-700">
      {!collapsed && <span className="text-lg font-bold text-primary">Finex</span>}
      <button
        type="button"
        onClick={onToggle}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </div>

    <nav className="flex-1 overflow-y-auto py-4 space-y-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {group.label}
            </p>
          )}
          <ul className="space-y-1 px-2">
            {group.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  </aside>
)
