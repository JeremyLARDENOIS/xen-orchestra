# Test runner

Testing uses **Vitest 4** with two projects (see `vite.config.ts`), CLI-only, no browser:

| Project       | Files                   | Environment | Covers                                                                     |
| ------------- | ----------------------- | ----------- | -------------------------------------------------------------------------- |
| `unit`        | `*.unit.test.ts`        | `node`      | code called directly: utilities, and composables run by `runComposable`    |
| `integration` | `*.integration.test.ts` | `happy-dom` | code mounted with its real dependencies: components, and `mountComposable` |

A test goes to `unit` whenever it can: it needs no DOM, so it runs in a fraction of the time. Mounting a component needs `@vue/test-utils` and `happy-dom`, not a browser; only real-CSS and layout assertions are out of reach, see [Testing components](./testing-components.md).

`test.alias` in that config maps `placement.js` to its ESM build: the package only declares a `module` entry, which the Node-style resolution used by Vitest ignores, so any component pulling in a menu fails to resolve it otherwise.

## Running tests

`yarn test` runs the suite once and exits. A bare `yarn vitest` starts watch mode, which
reruns the affected tests on every save — that is the one to use while developing.

```sh
cd @xen-orchestra/web

# Run the whole suite once
yarn test

# Run one project
yarn test:unit
yarn test:integration

# Watch mode
yarn vitest

# Watch a single module
yarn vitest src/modules/vm/

# Browse and re-run tests from the Vitest UI
yarn test:ui
```
