import { createLogger } from '@xen-orchestra/log'
import { invalidParameters } from 'xo-common/api-errors.js'

const log = createLogger('xo:xo-mixins:gui-extensions')

const GUIS = ['xo5', 'xo6']

// an absolute path on XO's origin: `/foo` but neither `foo` nor `//host/foo`
const SAME_ORIGIN_PATH_RE = /^\/(?!\/)/

// Lets plugins extend the web UIs (XO 5 and XO 6) with their own scripts.
//
// A GUI extension is an ES module, served by XO (e.g. via `registerHttpRequestHandler`) and referenced by its absolute
// path, that the UI loads at startup, before rendering. Each UI documents what it expects from these modules and what
// it gives them.
//
// No compatibility is guaranteed on what the UIs expose to extensions: extensions are the responsibility of the plugins
// registering them.
export default class GuiExtensions {
  constructor() {
    this._guiExtensions = { __proto__: null }
    for (const gui of GUIS) {
      this._guiExtensions[gui] = new Set()
    }
  }

  // Returns a function to unregister the extension.
  registerGuiExtension(gui, url) {
    const extensions = this._guiExtensions[gui]
    if (extensions === undefined) {
      throw invalidParameters(`gui must be one of ${GUIS.join(', ')}`)
    }
    if (typeof url !== 'string' || !SAME_ORIGIN_PATH_RE.test(url)) {
      throw invalidParameters('url must be an absolute path served by XO, e.g. /my-plugin/extension.js')
    }
    if (extensions.has(url)) {
      throw invalidParameters(`${url} is already registered as a ${gui} extension`)
    }

    extensions.add(url)
    log.info('GUI extension registered', { gui, url })

    let registered = true
    return () => {
      if (registered) {
        registered = false
        extensions.delete(url)
        log.info('GUI extension unregistered', { gui, url })
      }
    }
  }

  // Returns the URLs of the registered extensions, in registration order, for each GUI.
  getGuiExtensions() {
    const result = {}
    for (const gui of GUIS) {
      result[gui] = Array.from(this._guiExtensions[gui])
    }
    return result
  }
}
