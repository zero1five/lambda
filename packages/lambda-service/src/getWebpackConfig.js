import { getConfig } from 'lambda-webpack'
import assert from 'assert'
import chalk from 'chalk'
import nodeExternals from 'webpack-node-externals'

const debug = require('debug')('getWebpackConfig')

export default function(service, opts = {}) {
  const { ssr } = opts
  const { config } = service

  const webpackOpts = service.applyPlugins('modifyAFWebpackOpts', {
    initialValue: {
      cwd: service.cwd
    },
    args: {
      ssr
    }
  })

  assert(
    !('chainConfig' in webpackOpts),
    `chainConfig should not supplied in modifyAFWebpackOpts`
  )
  webpackOpts.chainConfig = webpackConfig => {
    service.applyPlugins('chainWebpackConfig', {
      args: webpackConfig
    })
    if (config.chainWebpack) {
      config.chainWebpack(webpackConfig, {
        webpack: require('lambda-webpack').webpack
      })
    }
  }

  const webpackConfig = service.applyPlugins('modifyWebpackConfig', {
    initialValue: getConfig({
      ...webpackOpts,
      ssr
    })
  })

  if (ssr) {
    // ssr in beta hint
    console.warn(
      chalk.keyword('orange')(
        `WARNING: UmiJS SSR is still in beta, you can open issues or PRs in https://github.com/umijs/umi`
      )
    )
    const nodeExternalsOpts = {
      whitelist: [
        /\.(css|less|sass|scss)$/,
        /^umi(\/.*)?$/,
        'umi-plugin-locale',
        ...(typeof ssr === 'object' && ssr.externalWhitelist
          ? ssr.externalWhitelist
          : [])
      ]
    }
    debug(`nodeExternalOpts:`, nodeExternalsOpts)
    // webpackConfig.externals = nodeExternals(nodeExternalsOpts)
    webpackConfig.output.libraryTarget = 'commonjs2'
    webpackConfig.output.filename = '[name].server.js'
    webpackConfig.output.chunkFilename = '[name].server.async.js'
    webpackConfig.plugins.push(
      new (require('write-file-webpack-plugin'))({
        test: /umi\.server\.js/
      })
    )
  }

  return webpackConfig
}
