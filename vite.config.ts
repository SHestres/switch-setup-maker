/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev/preview servers default to wildcard binding + permissive hosts so the app
// is reachable from other machines and containers. Override per environment.
const host = process.env.HOST ?? '0.0.0.0'
const devPort = Number(process.env.DEV_PORT ?? 5173)
const previewPort = Number(process.env.PREVIEW_PORT ?? 4173)

export default defineConfig({
  // Relative asset base: one dist/ works at a domain root or under a sub-path.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host,
    port: devPort,
    allowedHosts: true,
  },
  preview: {
    host,
    port: previewPort,
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
