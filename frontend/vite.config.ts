import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acesso de outros dispositivos na rede local
    port: 5173,
    strictPort: false, // Permite usar outra porta se 5173 estiver ocupada
  },
})
