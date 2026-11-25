import { effectScope } from 'vue'

/**
 * Runs a composable in an effect scope, without mounting a component: no DOM, so the test belongs to the `unit` project.
 *
 * Enough for a composable built on `computed`, `watch` and `ref`, and on collections the test mocks. One that needs a
 * component instance (`useI18n`, lifecycle hooks, `inject` of a plugin) still goes through `mountComposable`, in an
 * integration test.
 *
 * The result is returned as is: its refs are read through `.value`. The scope is stopped once the test is finished.
 */
export function runComposable<TResult>(composable: () => TResult): TResult {
  const scope = effectScope()
  const result = scope.run(composable) as TResult

  onTestFinished(() => scope.stop())

  return result
}
