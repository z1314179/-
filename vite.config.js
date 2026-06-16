import { defineConfig, loadEnv } from 'vite'
import fs from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import vue from '@vitejs/plugin-vue'
import { Plugin as importToCDN } from 'vite-plugin-cdn-import'
import { visualizer } from 'rollup-plugin-visualizer'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** 开发环境 /api 代理转发目标（与 .env 中 VITE_API_URL=/api 配合） */
const API_PROXY_TARGET = 'https://contract.test.coslets.com'
// const NODE_PROXY_TARGET = 'http://47.92.118.6:8080'
// const NODE_PROXY_TARGET = 'http://192.168.8.97:8000'
const NODE_PROXY_TARGET = 'http://192.168.8.63:8000'
const host = 'localhost'
// const host = '192.168.8.97'

/** 构建产物文件名带时间戳，避免缓存旧包 */
const BUILD_TS = Date.now()

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const isProd = mode === 'production'

  return {
    base: '/',

    resolve: {
      alias: [{ find: '@', replacement: resolve(__dirname, 'src') }],
    },

    define: {
      'process.env': {
        API: env.VITE_API_URL,
        URL: env.VITE_API_URL === '/api' ? API_PROXY_TARGET : env.VITE_API_URL,
        IMG: 'https://img.coslets.com',
        VERSION: env.VITE_APP_VERSION,
        NAME: 'contract',
      },
      __Admin_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    plugins: [
      vue(),
      visualizer({
        open: true,
        gzipSize: true,
      }),
      importToCDN({
        modules: [
          // 按需启用 CDN，例如：{ name: 'vue', var: 'Vue', path: '...' }
        ],
      }),
    ],

    server: {
      host: host,
      port: 8080,
      proxy: {
        '/api': {
          target: API_PROXY_TARGET,
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        // '/nodeApi': {
        //   target: NODE_PROXY_TARGET,
        //   secure: false,
        //   changeOrigin: true,
        //   timeout: 600000,
        //   proxyTimeout: 600000,
        //   rewrite: (path) => path.replace(/^\/nodeApi/, ''),
        // },
      },
    },

    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },

    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },

    build: {
      minify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 20000,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]${BUILD_TS}.js`,
          chunkFileNames: `assets/[name]${BUILD_TS}.js`,
          assetFileNames: `assets/[name]${BUILD_TS}.[ext]`,
        },
        plugins: [
          {
            name: 'write-version-json',
            generateBundle() {
              fs.writeFileSync(
                'dist/v.json',
                JSON.stringify({ v: env.VITE_APP_VERSION })
              )
            },
          },
        ],
      },
    },
  }
})
