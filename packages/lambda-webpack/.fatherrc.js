export default {
  target: 'node',
  cjs: { type: 'babel' },
  browserFiles: [
    'src/reactDevUtils/webpackHotDevClient.js',
    'src/reactDevUtils/utils.js',
    'src/reactDevUtils/formatWebpackMessages.js',
    'src/reactDevUtils/socket.js',
    'src/reactDevUtils/patchConnection.js'
  ]
}
