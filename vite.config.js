import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const elementPlusResolver = ElementPlusResolver({ importStyle: 'css' })

const vendorChunkRules = [
  { name: 'element-plus', includes: ['element-plus', '@element-plus/icons-vue'] },
  { name: 'vue-core', includes: ['vue', 'vue-router'] },
  { name: 'state', includes: ['pinia'] },
  { name: 'pocketbase', includes: ['pocketbase'] },
  { name: 'xlsx', includes: ['xlsx'] },
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [elementPlusResolver],
      dts: false,
    }),
    Components({
      resolvers: [elementPlusResolver],
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          for (const rule of vendorChunkRules) {
            if (rule.includes.some((pkg) => id.includes(pkg))) {
              return `chunk-${rule.name}`
            }
          }

          return 'chunk-vendor'
        },
      },
    },
  },
})
