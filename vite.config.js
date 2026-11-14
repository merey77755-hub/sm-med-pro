import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/sm-med-pro/', // GitHub Pages үшін бұл міндетті түрде керек
})