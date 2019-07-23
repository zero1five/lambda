export default {
  target: 'node',
  cjs: { type: 'babel' },
  browserFiles: [
    'src/reactDevUtils/webpackHotDevClient.js',
    'src/utils.js',
    'src/formatWebpackMessages.js',
    'src/socket.js',
    'src/patchConnection.js'
  ]
}
