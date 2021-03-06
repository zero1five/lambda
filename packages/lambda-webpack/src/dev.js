const fs = require('fs')
const openBrowser = require('react-dev-utils/openBrowser')
const webpack = require('webpack')
const assert = require('assert')
const WebpackDevServer = require('webpack-dev-server')
const chalk = require('chalk')
const signale = require('signale')
import send from './send'
const { STARTING, DONE } = require('./send')
const {
  prepareUrls,
  clearConsole,
  errorOverlayMiddleware,
  choosePort
} = require('./reactDevUtils')
const { isPlainObject } = require('lodash')

const isInteractive = process.stdout.isTTY
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8000
const HOST = process.env.HOST || '0.0.0.0'
const PROTOCOL = process.env.HTTPS ? 'https' : 'http'
const CERT =
  process.env.HTTPS && process.env.CERT ? fs.readFileSync(process.env.CERT) : ''
const KEY =
  process.env.HTTPS && process.env.KEY ? fs.readFileSync(process.env.KEY) : ''
const noop = () => {}

// process.env.CLEAR_CONSOLE = true

function getWebpackConfig(webpackConfig) {
  return Array.isArray(webpackConfig) ? webpackConfig[0] : webpackConfig
}

module.exports = ({
  webpackConfig,
  _beforeServerWithApp,
  beforeMiddlewares,
  afterMiddlewares,
  beforeServer,
  afterServer,
  contentBase,
  onCompileDone = noop,
  onFail = noop,
  proxy,
  port,
  base,
  watch,
  https = false,
  serverConfig: serverConfigFromOpts = {}
}) => {
  assert(webpackConfig, 'webpackConfig should be supplied.')
  assert(
    isPlainObject(webpackConfig) || Array.isArray(webpackConfig),
    'webpackConfig should be plain object or array.'
  )

  choosePort(port || DEFAULT_PORT)
    .then(port => {
      if (port === null) {
        return
      }

      if (process.send) {
        process.send({ type: 'UPDATE_PORT', port })
      }

      const compiler = webpack(webpackConfig)

      let isFirstCompile = true
      const IS_CI = !!process.env.CI
      const SILENT = !!process.env.SILENT
      const urls = prepareUrls(PROTOCOL, HOST, port, base)

      compiler.hooks.done.tap('lambda-webpack dev', stats => {
        if (stats.hasErrors()) {
          // make sound
          // ref: https://github.com/JannesMeyer/system-bell-webpack-plugin/blob/bb35caf/SystemBellPlugin.js#L14
          if (process.env.SYSTEM_BELL !== 'none') {
            process.stdout.write('\x07')
          }
          onFail({ stats })
          return
        }

        let copied = ''
        if (isFirstCompile && !IS_CI && !SILENT) {
          try {
            require('clipboardy').writeSync(urls.localUrlForBrowser)
            copied = chalk.dim('(copied to clipboard)')
          } catch (e) {
            copied = chalk.red(`(copy to clipboard failed)`)
          }
          clearConsole()
          console.log()
          signale.success(
            [
              `\n`,
              `  App running at:`,
              `  - Local:   ${chalk.cyan(urls.localUrlForTerminal)} ${copied}`,
              `  - Network: ${chalk.cyan(urls.lanUrlForTerminal)}`
            ].join('\n')
          )
          console.log()
        }

        onCompileDone({
          isFirstCompile,
          stats
        })

        if (isFirstCompile) {
          isFirstCompile = false
          openBrowser(urls.localUrlForBrowser)
          send({ type: DONE })
        }
      })

      const serverConfig = {
        disableHostCheck: true,
        compress: true,
        inline: true,
        clientLogLevel: 'none',
        hot: true,
        quiet: true,
        headers: {
          'access-control-allow-origin': '*'
        },
        publicPath: getWebpackConfig(webpackConfig).output.publicPath,
        watchOptions: {
          ignored: /node_modules/
        },
        historyApiFallback: false,
        overlay: false,
        host: HOST,
        proxy,
        https,
        cert: CERT,
        key: KEY,
        contentBase,
        before(app) {
          ;(beforeMiddlewares || []).forEach(middleware => {
            app.use(middleware)
          })
          // internal usage for proxy
          if (_beforeServerWithApp) {
            _beforeServerWithApp(app)
          }
          app.use(errorOverlayMiddleware())
        },
        after(app) {
          ;(afterMiddlewares || []).forEach(middleware => {
            app.use(middleware)
          })
        },
        ...serverConfigFromOpts,
        ...(getWebpackConfig(webpackConfig).devServer || {})
      }
      const server = new WebpackDevServer(compiler, serverConfig)

      ;['SIGINT', 'SIGTERM'].forEach(signal => {
        process.on(signal, () => {
          server.close(() => {
            process.exit(0)
          })
        })
      })

      if (beforeServer) {
        beforeServer(server)
      }

      server.listen(port, HOST, err => {
        if (err) {
          console.log(err)
          return
        }
        if (isInteractive) {
          clearConsole()
        }
        signale.pending('Starting the development server...\n')
        send({ type: STARTING })
        if (afterServer) {
          afterServer(server, port)
        }

        if (watch) {
          watch(server)
        }
      })
    })
    .catch(err => {
      console.log(err)
    })
}
