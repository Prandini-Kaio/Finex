import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      title={theme.mode === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
      aria-label="Alternar tema"
    >
      {theme.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

