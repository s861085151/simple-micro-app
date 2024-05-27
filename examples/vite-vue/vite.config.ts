import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'simple-micro-app': path.join(__dirname, '../../src/index.js')
    }
  },
  plugins: [vue()],
})
