import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { SidebarNav } from './SidebarNav'
import { ThemeToggle } from '../ThemeToggle'
import { NotificationCenter } from '../NotificationCenter'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/lancamentos': 'Lançamentos',
  '/fixos': 'Lançamentos Fixos',
  '/fechamento': 'Fechamento',
  '/orcamento': 'Planejamento',
  '/poupanca': 'Poupança',
  '/investimentos': 'Investimentos',
  '/contas': 'Contas Bancárias',
  '/configuracoes': 'Configurações',
}

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title = routeTitles[location.pathname] ?? 'Finex'

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900 transition-colors">
      <SidebarNav collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto px-6 py-8">
          <Outlet />
        </main>
      </div>

      <NotificationCenter />
    </div>
  )
}
