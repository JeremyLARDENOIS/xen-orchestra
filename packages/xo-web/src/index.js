import './patch-react'

import hashHistory from 'react-router/lib/hashHistory'
import React from 'react'
import Router from 'react-router/lib/Router'
import store from 'store'
import { Provider } from 'react-redux'
import { render } from 'react-dom'

import loadGuiExtensions from './gui-extensions'
import XoApp from './xo-app'

const routes = {
  ...XoApp.route,
  component: XoApp,
  path: '/',
}

// before rendering, so that routes added by extensions can be reached from a direct link
loadGuiExtensions({ history: hashHistory, routes, store }).then(() =>
  render(
    <Provider store={store}>
      <Router history={hashHistory} routes={routes} />
    </Provider>,
    document.getElementById('xo-app')
  )
)
