const { getWebpackConfig } = require('./utils')

let closed = false

// kill(2) Ctrl-C
process.once('SIGINT', () => onSignal('SIGINT'))
// kill(3) Ctrl-\
process.once('SIGQUIT', () => onSignal('SIGQUIT'))
// kill(15) default
process.once('SIGTERM', () => onSignal('SIGTERM'))

function onSignal() {
  if (closed) return
  closed = true
  process.exit(0)
}

const cwd = process.cwd()
const [webpackConfig, watch] = getWebpackConfig()

require(`../lib/dev`)({
  cwd,
  webpackConfig,
  watch
})
