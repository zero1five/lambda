export default {
  target: 'node',
  cjs: { type: 'babel' },
  esm: 'rollup',
  disableTypeCheck: true,
  browserFiles: [
    'src/createHistory.js',
    'src/renderRoutes.js',
    'src/Route.js',
    'src/history.js',
    'src/runtimePlugin.js',
    'src/utils.js',
    'src/withRouter.js'
  ],
  extraExternals: ['@tmp', 'react-router-dom', 'react']
}
