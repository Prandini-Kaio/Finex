import React from 'react';
import { DollarSign, TrendingUp, FileText, Calendar, Filter, Settings } from 'lucide-react';

type ViewType = 'dashboard' | 'transactions' | 'closure' | 'budget' | 'savings' | 'settings';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface NavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'transactions', label: 'Lançamentos', icon: FileText },
  { id: 'closure', label: 'Fechamento', icon: Calendar },
  { id: 'budget', label: 'Planejamento', icon: Filter },
  { id: 'savings', label: 'Poupança', icon: TrendingUp },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onViewChange,
}) => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <DollarSign className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Controle Financeiro</h1>
          </div>
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }
                  `}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

