import { defineConfig } from 'vite'
import yitiblog from './vite-plugin-yitiblog'

export default defineConfig({
  plugins: [
    yitiblog(),
  ],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
})
