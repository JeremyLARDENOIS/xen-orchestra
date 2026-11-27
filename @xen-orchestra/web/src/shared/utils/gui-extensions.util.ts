import {
  getGuiComponent,
  type GuiComponentOverride,
  overrideGuiComponent,
} from '@/shared/utils/gui-component-registry.util.ts'
import type i18n from '@core/i18n.ts'
import * as pinia from 'pinia'
import * as vue from 'vue'
import * as vueI18n from 'vue-i18n'
import * as vueRouter from 'vue-router'

/**
 * What a GUI extension receives.
 *
 * Extensions must use the given modules instead of bundling their own copies: Vue features relying on
 * injection (`useRoute`, `defineStore`, `useI18n`…) only work with the instances used by the app.
 *
 * No compatibility is guaranteed on this context nor on the app internals it gives access to.
 */
export type GuiExtensionContext = {
  app: vue.App
  i18n: typeof i18n
  pinia: pinia.Pinia
  router: vueRouter.Router
  /**
   * Replaces the single-file component at `path`, as imported in the code (e.g.
   * `@/modules/admin/components/AdministrationMenu.vue` or `@core/components/ui/card/UiCard.vue`), everywhere it is
   * used. `override` receives the current component, which the returned one can render to wrap it.
   *
   * Pages can be overridden the same way, or through `router`.
   */
  overrideComponent: (path: string, override: GuiComponentOverride) => void
  /**
   * Returns the single-file component at `path` if it is already loaded (i.e. bundled with the app entry rather than
   * with a page), e.g. to reuse it in a page of the extension.
   */
  getComponent: typeof getGuiComponent
  modules: {
    pinia: typeof pinia
    vue: typeof vue
    'vue-i18n': typeof vueI18n
    'vue-router': typeof vueRouter
  }
}

/**
 * A GUI extension is an ES module whose default export is called once, before the app is mounted and before the
 * initial navigation: routes added with `context.router.addRoute()` are therefore reachable from a direct link.
 */
export type GuiExtensionSetup = (context: GuiExtensionContext) => void | Promise<void>

async function fetchGuiExtensionUrls(): Promise<string[]> {
  const response = await fetch('/rest/v0/gui-extensions')
  if (!response.ok) {
    throw new Error(`unexpected response status ${response.status}`)
  }

  const { xo6 } = await response.json()
  return xo6
}

/**
 * Loads the extensions registered by XO plugins (see `registerGuiExtension` in xo-server).
 *
 * A failing extension is reported and skipped, it never prevents the app from starting.
 */
export async function loadGuiExtensions(
  context: Omit<GuiExtensionContext, 'getComponent' | 'modules' | 'overrideComponent'>
): Promise<void> {
  let urls: string[]
  try {
    urls = await fetchGuiExtensionUrls()
  } catch (error) {
    console.error('Failed to fetch GUI extensions', error)
    return
  }

  if (urls.length === 0) {
    return
  }

  const fullContext: GuiExtensionContext = {
    ...context,
    getComponent: getGuiComponent,
    overrideComponent: overrideGuiComponent,
    modules: { pinia, vue, 'vue-i18n': vueI18n, 'vue-router': vueRouter },
  }

  // downloaded in parallel, set up sequentially in registration order
  const imports = await Promise.allSettled(urls.map(url => import(/* @vite-ignore */ url)))

  for (const [index, result] of imports.entries()) {
    const url = urls[index]
    try {
      if (result.status === 'rejected') {
        throw result.reason
      }

      const setup = result.value.default
      if (typeof setup !== 'function') {
        throw new TypeError('the default export must be a function')
      }

      await (setup as GuiExtensionSetup)(fullContext)
    } catch (error) {
      console.error(`Failed to load GUI extension ${url}`, error)
    }
  }
}
