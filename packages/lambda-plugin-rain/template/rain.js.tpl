import rain, { createLoading } from 'redux-rain';
import { Component } from 'react';
import history from '@tmp/history';

let app = null;

export function _onCreate() {
  const plugins = require('lambda-echo/_runtimePlugin');
  const runtimeRain = plugins.mergeConfig('redux-rain');
  app = rain({
    history,
    <%= ExtendRainConfig %>
    ...(runtimeRain.config || {}),
    ...(window.g_useSSR ? { initialState: window.g_initialData } : {}),
  });
  <%= EnhanceApp %>
  app.use(createLoading());
  (runtimeRain.plugins || []).forEach(plugin => {
    app.use(plugin);
  });
  <%= RegisterPlugins %>
  <%= RegisterModels %>
  return app;
}

export function getApp() {
  return app;
}

export class _RainContainer extends Component {
  render() {
    const app = getApp();
    app.router(() => this.props.children);
    return app.run()();
  }
}
