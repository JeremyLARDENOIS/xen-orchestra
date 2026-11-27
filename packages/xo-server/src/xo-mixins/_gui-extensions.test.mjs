import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { configure } from '@xen-orchestra/log/configure'
import { invalidParameters } from 'xo-common/api-errors.js'

import GuiExtensions from './gui-extensions.mjs'

configure({ level: 'FATAL', transport: () => {} })

const isInvalidParameters = error => invalidParameters.is(error)

describe('GuiExtensions', () => {
  it('has no extensions by default', () => {
    assert.deepEqual(new GuiExtensions().getGuiExtensions(), { xo5: [], xo6: [] })
  })

  it('lists registered extensions per GUI, in registration order', () => {
    const app = new GuiExtensions()
    app.registerGuiExtension('xo6', '/b.js')
    app.registerGuiExtension('xo6', '/a.js')
    app.registerGuiExtension('xo5', '/c.js')

    assert.deepEqual(app.getGuiExtensions(), { xo5: ['/c.js'], xo6: ['/b.js', '/a.js'] })
  })

  it('unregisters an extension, only once', () => {
    const app = new GuiExtensions()
    const unregister = app.registerGuiExtension('xo6', '/a.js')
    unregister()
    assert.deepEqual(app.getGuiExtensions().xo6, [])

    // a later registration of the same URL is not removed by the stale function
    app.registerGuiExtension('xo6', '/a.js')
    unregister()
    assert.deepEqual(app.getGuiExtensions().xo6, ['/a.js'])
  })

  it('returns copies that cannot alter the registry', () => {
    const app = new GuiExtensions()
    app.getGuiExtensions().xo6.push('/a.js')
    assert.deepEqual(app.getGuiExtensions().xo6, [])
  })

  it('rejects an unknown GUI', () => {
    assert.throws(() => new GuiExtensions().registerGuiExtension('xo7', '/a.js'), isInvalidParameters)
  })

  it('rejects an invalid URL', () => {
    const app = new GuiExtensions()
    for (const url of [undefined, '', 'a.js', './a.js', '//example.org/a.js', 'https://example.org/a.js']) {
      assert.throws(() => app.registerGuiExtension('xo6', url), isInvalidParameters, String(url))
    }
  })

  it('rejects an already registered URL', () => {
    const app = new GuiExtensions()
    app.registerGuiExtension('xo6', '/a.js')
    assert.throws(() => app.registerGuiExtension('xo6', '/a.js'), isInvalidParameters)

    // the same URL can be registered for another GUI
    app.registerGuiExtension('xo5', '/a.js')
  })
})
