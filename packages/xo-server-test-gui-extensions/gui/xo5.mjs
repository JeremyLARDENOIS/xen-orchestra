// XO 5 extension: adds the page `#/gui-extensions-test` and an entry in the main menu.
//
// XO 5 has no dedicated extension points: the menu entry is added by wrapping the root component of the app, which
// renders the menu. Each line of the page checks that one of the shared modules works from an extension.

// relative, like the rest of XO 5, which can be served under `/v5/`
const SERVER_INFO_URL = './rest/v0/plugins/test-gui-extensions/info'

const PATH = '/gui-extensions-test'

export default function setup({ addRoute, modules, routes }) {
  const React = modules.react
  const ReactDom = modules['react-dom']
  const { connect } = modules['react-redux']
  const { Link } = modules['react-router']
  const h = React.createElement

  class TestPage extends React.Component {
    constructor(props) {
      super(props)
      this.state = { count: 0, serverInfo: 'loading…' }
    }

    async componentDidMount() {
      let serverInfo
      try {
        const response = await fetch(SERVER_INFO_URL)
        serverInfo = `${response.status} ${JSON.stringify(await response.json())}`
      } catch (error) {
        serverInfo = `error: ${error}`
      }
      this.setState({ serverInfo })
    }

    render() {
      const { location, user } = this.props
      const { count, serverInfo } = this.state

      return h(
        'div',
        { className: 'container' },
        h('h1', null, 'GUI extension test (XO 5)'),
        h(
          'ul',
          null,
          h('li', null, `react-router: current path is ${location.pathname}`),
          h('li', null, `react-redux: signed in as ${user?.email ?? '?'}`),
          h(
            'li',
            null,
            `react: count is ${count} `,
            h('button', { type: 'button', onClick: () => this.setState({ count: count + 1 }) }, '+1')
          ),
          h('li', null, `xo-server: ${serverInfo}`)
        ),
        h(Link, { to: '/home' }, 'Back to the home page')
      )
    }
  }

  addRoute({
    path: PATH.slice(1),
    component: connect(state => ({ user: state.user }))(TestPage),
  })

  // the menu entry, with the classes of the native ones
  const MenuEntry = () =>
    h(
      Link,
      { activeClassName: 'active', className: 'nav-link', to: PATH },
      h('i', { className: 'xo-icon-plugin fa-lg fa-fw' }),
      ' GUI extension test'
    )

  // Wraps the app to insert the entry in the menu, before the REST API link, once the menu is rendered. The entry is
  // rendered as a subtree of the wrapper, so that it gets the router from the React context.
  const App = routes.component
  class AppWithMenuEntry extends React.Component {
    componentDidMount() {
      this._insertMenuEntry()
    }

    componentDidUpdate() {
      this._insertMenuEntry()
    }

    componentWillUnmount() {
      if (this._item !== undefined) {
        ReactDom.unmountComponentAtNode(this._item)
        this._item.remove()
      }
    }

    _insertMenuEntry() {
      const nextItem = document.querySelector('.xo-menu a[href="/rest/v0/docs/"]')?.closest('li')
      if (nextItem == null) {
        return
      }

      let item = this._item
      if (item === undefined) {
        item = this._item = document.createElement('li')
        item.className = 'nav-item xo-menu-item'
      }
      if (item.nextSibling !== nextItem) {
        nextItem.parentNode.insertBefore(item, nextItem)
      }
      ReactDom.unstable_renderSubtreeIntoContainer(this, h(MenuEntry), item)
    }

    render() {
      return h(App, this.props)
    }
  }
  routes.component = AppWithMenuEntry

  // eslint-disable-next-line no-console
  console.info('[test-gui-extensions] XO 5 extension loaded')
}
