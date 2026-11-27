import type { Component } from 'vue'

/**
 * Receives a copy of the component (or of the result of the previous override) and returns the component to use
 * instead, which can render the given one to wrap it.
 */
export type GuiComponentOverride = (original: Component) => Component

// Every single-file component registers itself here, under its import path (e.g.
// `@/modules/admin/components/AdministrationMenu.vue` or `@core/components/ui/card/UiCard.vue`), see
// `guiComponentRegistryPlugin` in `vite.config.ts`.
const components = new Map<string, Component>()
const overrides = new Map<string, GuiComponentOverride[]>()

// The component object is modified in place, so that every module importing it uses the override.
function applyOverride(path: string, component: Component, override: GuiComponentOverride) {
  if (typeof component !== 'object' || component === null) {
    throw new TypeError(`${path} cannot be overridden: it is not a component object`)
  }

  const original = { ...component }
  const replacement = override(original)
  if (typeof replacement !== 'object' || replacement === null) {
    throw new TypeError(`the override of ${path} must return a component object, e.g. made with defineComponent()`)
  }

  const target = component as Record<string | symbol, unknown>
  for (const key of Reflect.ownKeys(target)) {
    delete target[key]
  }
  Object.assign(target, replacement)
}

/**
 * Called by every single-file component when its module is evaluated: applies the overrides already registered.
 */
export function registerGuiComponent<T extends Component>(path: string, component: T): T {
  components.set(path, component)
  for (const override of overrides.get(path) ?? []) {
    try {
      applyOverride(path, component, override)
    } catch (error) {
      console.error(`Failed to override ${path}`, error)
    }
  }
  return component
}

/**
 * Replaces the single-file component at `path` (as imported in the code, e.g.
 * `@/modules/admin/components/AdministrationMenu.vue`) everywhere it is used.
 *
 * Applied right away if the component is already loaded, otherwise when it is. Instances already mounted are not
 * affected, which is why GUI extensions are set up before the app is mounted.
 */
export function overrideGuiComponent(path: string, override: GuiComponentOverride): void {
  let pathOverrides = overrides.get(path)
  if (pathOverrides === undefined) {
    overrides.set(path, (pathOverrides = []))
  }
  pathOverrides.push(override)

  const component = components.get(path)
  if (component !== undefined) {
    applyOverride(path, component, override)
  }
}

/**
 * Returns the single-file component at `path` if its module has already been loaded.
 */
export function getGuiComponent(path: string): Component | undefined {
  return components.get(path)
}
