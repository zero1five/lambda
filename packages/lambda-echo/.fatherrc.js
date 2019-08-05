export default {
  target: 'node',
  cjs: { type: 'babel' },
  esm: 'rollup',
  disableTypeCheck: true,
  browserFiles: [
    'src/createHistory.js',
    'src/renderRoutes.js',
    'src/Route.js',
    'src/router.js',
    'src/runtimePlugin.js',
    'src/utils.js',
    'src/withRouter.js'
  ],
  extraExternals: ['@tmp', 'react-router-dom', 'react']
}
