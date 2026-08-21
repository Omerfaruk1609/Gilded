import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 🛡️ Madde 15: Kodu Karart & Source Map Gizle (Production'da kaynak kod haritalarını kapat)
    sourcemap: false
  }
})
