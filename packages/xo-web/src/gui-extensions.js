import * as React from 'react'
import * as ReactDom from 'react-dom'
import * as ReactRedux from 'react-redux'
import * as ReactRouter from 'react-router'

// Loads `assets/import-module.mjs` and returns the native `import()` it exposes.
const getImportModule = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'assets/import-module.mjs'
    script.onload = () => {
      const importModule = window.xo5ImportModule
      delete window.xo5ImportModule
      script.remove()
      if (typeof importModule === 'function') {
        resolve(importModule)
      } else {
        reject(new Error('assets/import-module.mjs did not expose xo5ImportModule'))
      }
    }
    script.onerror = () => {
      script.remove()
      reject(new Error('failed to load assets/import-module.mjs'))
    }
    document.head.appendChild(script)
  })

const fetchGuiExtensionUrls = async () => {
  const response = await fetch('./rest/v0/gui-extensions')
  if (!response.ok) {
    throw new Error(`unexpected response status ${response.status}`)
  }
  return (await response.json()).xo5
}

// Loads the extensions registered by XO plugins (see `registerGuiExtension` in xo-server).
//
// An extension is an ES module whose default export is called once, before the app is rendered, with:
//
// - `addRoute(route)`: adds a react-router 3 route (`{ path, component, … }`) under `/`, before the catch-all route
// - `routes`: the root route, whose `component` is the whole app (`XoApp`, including the menu) and whose `childRoutes`
//   are the pages: any of them can be replaced, or wrapped by replacing its `component`
// - `history`: the history used by the router
// - `store`: the Redux store
// - `modules`: `react`, `react-dom`, `react-redux` and `react-router`, which extensions must use instead of bundling
//   their own copies
//
// No compatibility is guaranteed on this context nor on the app internals it gives access to.
//
// A failing extension is reported and skipped, it never prevents the app from starting.
export default async function loadGuiExtensions({ history, routes, store }) {
  let urls, importModule
  try {
    urls = await fetchGuiExtensionUrls()
    if (urls.length === 0) {
      return
    }
    importModule = await getImportModule()
  } catch (error) {
    console.error('Failed to load GUI extensions', error)
    return
  }

  const { childRoutes } = routes
  const context = {
    addRoute(route) {
      const catchAllIndex = childRoutes.findIndex(_ => _.path === '*')
      childRoutes.splice(catchAllIndex === -1 ? childRoutes.length : catchAllIndex, 0, route)
    },
    history,
    routes,
    store,
    modules: {
      react: React,
      'react-dom': ReactDom,
      'react-redux': ReactRedux,
      'react-router': ReactRouter,
    },
  }

  // downloaded in parallel, set up sequentially in registration order
  const imports = await Promise.all(
    urls.map(url =>
      importModule(url).then(
        module => ({ module }),
        error => ({ error })
      )
    )
  )

  for (const [index, result] of imports.entries()) {
    const url = urls[index]
    try {
      if (result.error !== undefined) {
        throw result.error
      }

      const setup = result.module.default
      if (typeof setup !== 'function') {
        throw new TypeError('the default export must be a function')
      }

      await setup(context)
    } catch (error) {
      console.error(`Failed to load GUI extension ${url}`, error)
    }
  }
}
