import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { localStorageService } from './services/storage/localStorageService'
import { initializeMockData } from './services/storage/storageInitializer'

// Inicializa window.storage usando o serviço de localStorage
// No futuro, isso será substituído por uma integração com backend
if (!window.storage) {
  window.storage = {
    get: (key: string) => localStorageService.get(key),
    set: (key: string, value: string) => localStorageService.set(key, value),
  };
}

// Inicializa dados mockados no localStorage na primeira execução
initializeMockData().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
