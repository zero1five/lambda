export default {
  target: 'node',
  cjs: { type: 'babel' },
  esm: 'rollup',
  disableTypeCheck: true,
  browserFiles: [
    'src/createHistory.js',
    'src/renderRoutes.js',
    'src/history.js',
    'src/runtimePlugin.js',
    'src/utils.js'
  ],
  extraExternals: ['@tmp', 'react-router-dom', 'react']
}
