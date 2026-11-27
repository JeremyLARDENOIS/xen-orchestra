'use strict'

// A plugin delivering at once:
//
// - a REST route, served by xo-server
// - an XO 5 extension, adding a page
// - an XO 6 extension, adding a page
//
// The extensions are plain ES modules (no build step), served by xo-server itself.

const { createReadStream } = require('node:fs')
const { join } = require('node:path')

const NAME = 'test-gui-extensions'

// paths of the extensions, as requested by the browser
const GUI_FILES = {
  xo5: `/${NAME}/xo5.mjs`,
  xo6: `/${NAME}/xo6.mjs`,
}

class TestGuiExtensionsPlugin {
  constructor({ xo }) {
    this._xo = xo
    this._cleaners = []
  }

  async load() {
    const xo = this._xo
    const cleaners = this._cleaners

    // server part: GET /rest/v0/plugins/test-gui-extensions/info
    cleaners.push(
      xo.registerRestRoutes(
        [
          {
            method: 'get',
            endpoint: '/info',
            description: 'Data computed by the server part of the plugin',
            // available to any authenticated user, like the pages using it
            scope: 'acl',
            callback: ({ restApi }) => ({
              plugin: NAME,
              serverTime: new Date().toISOString(),
              user: restApi.xoApp.apiContext.user?.email,
            }),
          },
        ],
        `/plugins/${NAME}`
      )
    )

    for (const [gui, path] of Object.entries(GUI_FILES)) {
      // ES modules are only executed when served with a JavaScript content type
      cleaners.push(
        await xo.registerHttpRequestHandler(path, (req, res) => {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
          return createReadStream(join(__dirname, 'gui', `${gui}.mjs`))
        })
      )
      cleaners.push(xo.registerGuiExtension(gui, path))
    }
  }

  unload() {
    const cleaners = this._cleaners.splice(0)
    for (const clean of cleaners.reverse()) {
      clean()
    }
  }
}

exports.default = opts => new TestGuiExtensionsPlugin(opts)
