{{{ importsAhead }}}
import React from 'react';
import { Router as DefaultRouter, Route, Switch } from 'react-router-dom';
import dynamic from 'lambda-echo/dynamic';
import renderRoutes from 'lambda-echo/lib/renderRoutes';
import history from '@tmp/history';
{{{ imports }}}

const Router = {{{ RouterRootComponent }}};

const routes = {{{ routes }}};
{{#globalVariables}}
window.g_routes = routes;
{{/globalVariables}}
const plugins = require('lambda-echo/_runtimePlugin');
plugins.applyForEach('patchRoutes', { initialValue: routes });

// route change handler
function routeChangeHandler(location, action) {
  plugins.applyForEach('onRouteChange', {
    initialValue: {
      routes,
      location,
      action,
    },
  });
}
history.listen(routeChangeHandler);
routeChangeHandler(history.location);

export { routes };

export default function RouterWrapper(props = {}) {
  return (
{{{ routerContent }}}
  );
}
