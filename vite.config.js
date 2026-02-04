import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import viteCompression from 'vite-plugin-compression'

// eslint
import eslintPlugin from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig(({ command })=> {
  return {
    plugins: [
      vue(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/icons/svg')],
        symbolId: 'icon-[dir]-[name]'
      }),
      // 自动引入内容
      AutoImport({
        imports: [
          'vue',
          'vue-router'
        ],
        dirs: [
          'src/hooks/**',
          'src/stores/**',
          'src/utils/**'
        ],
        resolvers: command === 'build' ? [ElementPlusResolver()] : [],
        dts: 'src/auto-import/imports.d.ts',
        eslintrc: {
          enabled: false
        }
      }),
      // 自动引入组件
      Components({
        dirs: [
          'src/components'
        ],
        resolvers: command === 'build' ? [ElementPlusResolver()] : [],
        dts: 'src/auto-import/components.d.ts'
      }),
      // 对大于 1k 的文件进行压缩
      viteCompression({
        threshold: 1000,
      })
    ].concat(
      // eslint
      command !== 'build' ? [eslintPlugin({ include: ['src/**/*.js', 'src/**/*.vue', 'src/*.js', 'src/*.vue'] })] : []
    ),
    server: {
      host: true,
      port: 9527,
      open: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js'
      }
    },
    build: {
      base: './',
      rollupOptions: {
        // 静态资源分类打包
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
          // 代码拆分配置 - 避免循环依赖和初始化顺序问题
          manualChunks: (id) => {
            // node_modules 中的依赖进行拆分
            if (id.includes('node_modules')) {
              // Vue 核心生态（Vue、Vue Router、Pinia）打包在一起，避免循环依赖
              if (id.includes('vue-router') || id.includes('pinia') || (id.includes('vue') && !id.includes('element-plus') && !id.includes('@element-plus'))) {
                return 'vue-vendor'
              }
              // Element Plus Icons 单独打包（需要在 element-plus 之前检查）
              if (id.includes('@element-plus/icons-vue')) {
                return 'element-icons'
              }
              // Element Plus UI 库单独打包（体积较大）
              if (id.includes('element-plus')) {
                return 'element-plus'
              }
              // ECharts 图表库单独打包（体积较大，且独立使用）
              if (id.includes('echarts')) {
                return 'echarts'
              }
              // Avue 表单组件库单独打包
              if (id.includes('@smallwei/avue')) {
                return 'avue'
              }
              // Moment.js 日期库单独打包（体积较大）
              if (id.includes('moment')) {
                return 'moment'
              }
              // 其他常用工具库打包到一起（避免拆分过细导致的问题）
              if (id.includes('axios') || id.includes('lodash') || id.includes('crypto-js') || id.includes('qs')) {
                return 'utils'
              }
              // 其他第三方库打包到一起
              return 'vendor'
            }
          },
          // 使用 ES 模块格式，避免 CommonJS require 相关错误
          format: 'es'
        }
      },
      sourcemap: false,
      target: 'es2015',
      reportCompressedSize: false,
      // 设置 chunk 大小警告限制（500KB）
      chunkSizeWarningLimit: 500,
      // 确保使用 ES 模块格式，避免 CommonJS require 相关问题
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
        // 确保 CommonJS 模块正确转换
        strictRequires: true
      }
    }
  }
})
