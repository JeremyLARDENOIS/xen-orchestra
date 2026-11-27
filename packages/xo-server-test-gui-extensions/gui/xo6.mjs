// XO 6 extension, overriding components of the app:
//
// - the administration menu, to add a section linking to the page of the extension
// - the plugins page (`/admin/plugins`), to add a notice above it
//
// and adding the page `#/admin/gui-extensions-test`, whose lines check that the shared modules work from an extension.

const SERVER_INFO_URL = '/rest/v0/plugins/test-gui-extensions/info'

const MESSAGES = {
  en: {
    'test-gui-extensions.notice': 'This page is extended by the test-gui-extensions plugin.',
    'test-gui-extensions.section': 'Test GUI extensions',
    'test-gui-extensions.title': 'GUI extension test',
  },
  fr: {
    'test-gui-extensions.notice': 'Cette page est étendue par le plugin test-gui-extensions.',
    'test-gui-extensions.section': "Test d'extensions",
    'test-gui-extensions.title': "Test d'extension de l'interface",
  },
}

export default function setup({ getComponent, i18n, modules, overrideComponent, router }) {
  const { defineComponent, h, onMounted, ref } = modules.vue
  const { useRoute } = modules['vue-router']
  const { defineStore } = modules.pinia
  const { useI18n } = modules['vue-i18n']

  for (const [locale, messages] of Object.entries(MESSAGES)) {
    i18n.global.mergeLocaleMessage(locale, messages)
  }

  // Components already loaded with the app (they are used by its layout); the elements fall back to plain HTML if
  // that is no longer the case.
  const component = (path, fallback) => getComponent(path) ?? fallback
  const MenuItem = component('@core/components/menu/MenuItem.vue', 'li')
  const UiLink = component('@core/components/ui/link/UiLink.vue', 'a')

  // Administration menu: adds a section after the native ones.
  //
  // The components take the scope ID of the menu, so that the scoped styles of the menu apply to the section.
  overrideComponent('@/modules/admin/components/AdministrationMenu.vue', AdministrationMenu => {
    const { __scopeId } = AdministrationMenu

    const MenuSection = defineComponent({
      name: 'TestGuiExtensionsMenuSection',
      __scopeId,
      setup() {
        const { t } = useI18n()
        const renderLink = () =>
          h(UiLink, { size: 'small', class: 'menu-link', to: { name: 'gui-extensions-test' } }, () =>
            t('test-gui-extensions.title')
          )

        return () =>
          h('nav', { class: 'administration-menu', style: 'flex-grow: 1' }, [
            h('section', { class: 'menu-section' }, [
              h('div', { class: 'section-title typo-h6' }, t('test-gui-extensions.section')),
              h('ul', { class: 'menu-links' }, [h(MenuItem, { accent: 'neutral' }, renderLink)]),
            ]),
          ])
      },
    })

    return defineComponent({
      name: 'TestGuiExtensionsAdministrationMenu',
      setup: () => () =>
        h('div', { style: 'display: flex; flex-direction: column; height: 100%' }, [
          h(AdministrationMenu, { style: 'height: auto' }),
          h(MenuSection),
        ]),
    })
  })

  // Plugins page: adds a notice above it. The page is only loaded when visited, the override is applied then.
  overrideComponent('@/pages/admin/plugins.vue', PluginsPage =>
    defineComponent({
      name: 'TestGuiExtensionsPluginsPage',
      setup() {
        const { t } = useI18n()

        return () => [
          h(
            'p',
            {
              class: 'typo-body-regular-small',
              style:
                'margin: 0; padding: 0.8rem 1.6rem; color: var(--color-info-txt-base); background-color: var(--color-info-background-selected)',
            },
            t('test-gui-extensions.notice')
          ),
          h(PluginsPage),
        ]
      },
    })
  )

  // Page of the extension
  const useCounterStore = defineStore('test-gui-extensions', {
    state: () => ({ count: 0 }),
    actions: {
      increment() {
        this.count++
      },
    },
  })

  const TestPage = defineComponent({
    name: 'TestGuiExtensionsPage',
    setup() {
      const route = useRoute()
      const { locale, t } = useI18n()
      const counter = useCounterStore()
      const serverInfo = ref('loading…')

      onMounted(async () => {
        try {
          const response = await fetch(SERVER_INFO_URL)
          serverInfo.value = `${response.status} ${JSON.stringify(await response.json())}`
        } catch (error) {
          serverInfo.value = `error: ${error}`
        }
      })

      return () =>
        h('div', { style: 'padding: 2rem; display: flex; flex-direction: column; gap: 1rem' }, [
          h('h1', { class: 'typo-h3' }, t('test-gui-extensions.title')),
          h('ul', { class: 'typo-body-regular' }, [
            h('li', `vue-router: current route is ${route.fullPath}`),
            h('li', `vue-i18n: current locale is ${locale.value}`),
            h('li', [
              `pinia: count is ${counter.count} `,
              h('button', { type: 'button', onClick: () => counter.increment() }, '+1'),
            ]),
            h('li', `xo-server: ${serverInfo.value}`),
          ]),
        ])
    },
  })

  router.addRoute({ path: '/admin/gui-extensions-test', name: 'gui-extensions-test', component: TestPage })

  // eslint-disable-next-line no-console
  console.info('[test-gui-extensions] XO 6 extension loaded')
}
