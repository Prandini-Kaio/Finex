import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado. Verifique o index.html.')
}

// Aplicar tema inicial antes de renderizar
const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
  try {
    const theme = JSON.parse(savedTheme)
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark')
    }
  } catch {
    // Tema padrão é dark
    document.documentElement.classList.add('dark')
  }
} else {
  // Tema padrão é dark
  document.documentElement.classList.add('dark')
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

