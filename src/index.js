import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { Router, Route, browserHistory } from 'react-router'

import './index.css'
import 'patternfly/dist/css/patternfly.css'
import 'patternfly/dist/css/patternfly-additions.css'

// Patternfly dependencies
// jQuery needs to be globally available (webpack.ProvidePlugin can be also used for this)
window.$ = window.jQuery = require('jquery')
require('bootstrap/dist/js/bootstrap')
require('patternfly/dist/js/patternfly')

import store, { sagaMiddleware } from './store'
import Selectors from './selectors'
import AppConfiguration, { readConfiguration } from './config'
import { loadTokenFromSessionStorage, loadStateFromLocalStorage } from './storage'
import { valuesOfObject } from './helpers'
import { rootSaga } from './sagas'
import { schedulerOneMinute } from './actions'

import App from './App'
import LoginForm from './LoginForm'
import { login, updateIcons } from 'ovirt-ui-components'

function requireLogin (nextState, replace) {
  let token = store.getState().config.get('loginToken')
  if (!token) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname },
    })
  }
}

function renderApp () {
  ReactDOM.render(
    <Provider store={store}>
      <Router history={browserHistory}>
        <Route path='/login' component={LoginForm} />
        <Route path='/' component={App} onEnter={requireLogin} />
      </Router>
    </Provider>,
    document.getElementById('root')
  )
}

function fetchToken () {
  // get token from session storage
  const { token, username } = loadTokenFromSessionStorage()
  if (token) {
    return { token, username }
  }

  if (AppConfiguration.sso && AppConfiguration.ssoRedirectURL && AppConfiguration.userPortalURL) {
    // TODO: get request header for SSO token/username; store to session storage; continue with token
    // TODO: return {token, username}

    // else redirect to SSO
    const language = window.navigator.userLanguage || window.navigator.language
    const ssoUrl = AppConfiguration.ssoRedirectURL
      .replace('[UP_URL]', encodeURIComponent(AppConfiguration.userPortalURL))
      .replace('[LOCALE]', encodeURIComponent(language))
    window.location.replace(ssoUrl)
    // END OF THIS APP
  } else {
    // SSO is not configured, show LoginForm
    console.log('SSO is not configured, rendering own Login Form. Please consider setting "ssoRedirectURL" and "userPortalURL" in the userportal.config file.')
    return {}
  }
}

function loadPersistedState () {
  // load persisted icons, etc ...
  const { icons } = loadStateFromLocalStorage()

  if (icons) {
    const iconsArray = valuesOfObject(icons)
    console.log(`loadPersistedState: ${iconsArray.length} icons loaded`)
    store.dispatch(updateIcons({ icons: iconsArray }))
  }
}

function start () {
  readConfiguration()
  console.log(`Merged configuration: ${JSON.stringify(AppConfiguration)}`)

  const { token, username } = fetchToken()

  // do initial render
  renderApp()

  // handle external actions
  sagaMiddleware.run(rootSaga)

  // initiate data retrieval
  Selectors.init({ store })

  loadPersistedState()

  if (token) {
    store.dispatch(login({ username, token }))
  } // otherwise wait for LoginForm or SSO

  // start cron-jobs
  store.dispatch(schedulerOneMinute())
}

start()
