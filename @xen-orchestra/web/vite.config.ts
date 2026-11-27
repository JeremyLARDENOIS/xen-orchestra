import { relative, sep } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import MagicString from 'magic-string'
import { defineConfig, loadEnv, Plugin, PluginOption } from 'vite'
import vueRouter from 'vue-router/vite'

const SRC_DIR = fileURLToPath(new URL('./src', import.meta.url))
const CORE_DIR = fileURLToPath(new URL('../web-core/lib', import.meta.url))

const EXPORT_DEFAULT = '\nexport default '

// Registers every single-file component of the app under its import path (`@/…` or `@core/…`), so that GUI extensions
// can override any of them, see `gui-component-registry.util.ts`.
function guiComponentRegistryPlugin(): Plugin {
  const getImportPath = (file: string) => {
    for (const [alias, dir] of [
      ['@', SRC_DIR],
      ['@core', CORE_DIR],
    ]) {
      const path = relative(dir, file)
      if (!path.startsWith('..')) {
        return `${alias}/${path.split(sep).join('/')}`
      }
    }
  }

  return {
    name: 'xo:gui-component-registry',
    enforce: 'post',
    transform(code, id) {
      // sub-modules of single-file components (styles, templates…) have a query
      if (!id.endsWith('.vue')) {
        return
      }

      const importPath = getImportPath(id)
      // the export added by `@vitejs/plugin-vue`, at the end of the module
      const index = importPath === undefined ? -1 : code.lastIndexOf(EXPORT_DEFAULT)
      if (index === -1) {
        return
      }

      const s = new MagicString(code)
      s.prepend(
        "import { registerGuiComponent as __registerGuiComponent } from '@/shared/utils/gui-component-registry.util.ts'\n"
      )
      s.overwrite(index, index + EXPORT_DEFAULT.length, '\nconst __guiComponent = ')
      s.append(`\nexport default __registerGuiComponent(${JSON.stringify(importPath)}, __guiComponent)\n`)
      return { code: s.toString(), map: s.generateMap({ hires: 'boundary' }) }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_XO_REST_HOST } = loadEnv(mode, process.cwd())
  const isDevMode = mode === 'development'

  return {
    base: './',
    plugins: [
      vueRouter({
        dts: isDevMode ? './src/route-map.d.ts' : false,
        exclude: isDevMode ? [] : ['src/pages/dev/**'],
      }),
      vue(),
      guiComponentRegistryPlugin(),
      vueI18n({
        include: fileURLToPath(new URL('../web-core/lib/locales/**', import.meta.url)),
      }),
    ] as PluginOption[],
    resolve: {
      alias: {
        '@': SRC_DIR,
        '@core': CORE_DIR,
      },
    },
    server: {
      proxy: {
        '/api': {
          target: `ws://${VITE_XO_REST_HOST}`,
          ws: true,
        },
        '/rest': {
          target: `http://${VITE_XO_REST_HOST}`,
        },
      },
    },
    optimizeDeps: {
      include: ['value-matcher', 'complex-matcher', 'xo-remote-parser', '@xen-orchestra/cron'],
    },
    test: {
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      alias: {
        // `placement.js` only declares a `module` entry, which the Node-style resolution used by Vitest ignores
        'placement.js': fileURLToPath(new URL('../../node_modules/placement.js/dist/index.es.js', import.meta.url)),
      },
      projects: [
        {
          extends: true,
          test: {
            include: ['**/*.unit.{test,spec}.ts'],
            name: 'unit',
            environment: 'happy-dom',
          },
        },
      ],
    },
  }
})
