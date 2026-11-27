# xo-server-test-gui-extensions

> Test plugin extending xo-server, XO 5 and XO 6 at once

Not meant to be published: it exercises `registerGuiExtension()` and doubles as an example.

## What it adds

- `GET /rest/v0/plugins/test-gui-extensions/info`, available to any authenticated user
- XO 5: the page `/v5/#/gui-extensions-test`, linked from the main menu by wrapping the root component of the app
- XO 6: the page `/v6/#/admin/gui-extensions-test`, linked from a section added to the administration menu by overriding its component, and a notice added to the plugins page by overriding it

Each page checks that the modules shared by the UI work from an extension (router, store, i18n…) and calls the REST route above.

## Usage

With xo-server started from `packages/xo-server`, `'../'` in `plugins.lookupPaths` makes it find this plugin, which is loaded at startup. It can be unloaded and loaded again from the plugins settings: the UIs pick the change up on the next page load.

The extensions are plain ES modules, without build step, served by xo-server from [`gui/`](./gui).
