import AdministrationMenu from '@/modules/admin/components/AdministrationMenu.vue'
import {
  getGuiComponent,
  overrideGuiComponent,
  registerGuiComponent,
} from '@/shared/utils/gui-component-registry.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

const makeComponent = (text: string) => defineComponent({ name: 'Test', setup: () => () => h('p', text) })

const render = (component: object) => mount(component).html()

describe('overrideGuiComponent', () => {
  it('replaces a component registered before the override', () => {
    const component = registerGuiComponent('@/test/before.vue', makeComponent('original'))

    overrideGuiComponent('@/test/before.vue', () => makeComponent('override'))

    expect(render(component)).toBe('<p>override</p>')
  })

  it('replaces a component registered after the override', () => {
    overrideGuiComponent('@/test/after.vue', () => makeComponent('override'))

    const component = registerGuiComponent('@/test/after.vue', makeComponent('original'))

    expect(render(component)).toBe('<p>override</p>')
  })

  it('lets overrides wrap the previous version, in registration order', () => {
    const component = registerGuiComponent('@/test/chain.vue', makeComponent('original'))

    overrideGuiComponent('@/test/chain.vue', original => defineComponent({ setup: () => () => h('div', [h(original)]) }))
    overrideGuiComponent('@/test/chain.vue', original => defineComponent({ setup: () => () => h('main', [h(original)]) }))

    expect(render(component)).toBe('<main>\n  <div>\n    <p>original</p>\n  </div>\n</main>')
  })

  it('rejects overrides that do not return a component object', () => {
    registerGuiComponent('@/test/invalid.vue', makeComponent('original'))

    expect(() => overrideGuiComponent('@/test/invalid.vue', () => (() => null) as any)).toThrow(TypeError)
  })
})

describe('single-file components', () => {
  it('are registered under their import path', () => {
    expect(getGuiComponent('@/modules/admin/components/AdministrationMenu.vue')).toBe(AdministrationMenu)
  })

  it('can be overridden everywhere they are imported', () => {
    overrideGuiComponent('@/modules/admin/components/AdministrationMenu.vue', original =>
      defineComponent({ setup: () => () => h('div', { class: 'wrapper' }, [h(original), h('p', 'added')]) })
    )

    const wrapper = mount(AdministrationMenu, { global: createGlobalTestConfig() })

    expect(wrapper.find('.wrapper > .administration-menu').exists()).toBe(true)
    expect(wrapper.find('.wrapper > p').text()).toBe('added')
  })
})
