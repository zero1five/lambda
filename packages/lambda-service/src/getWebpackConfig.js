import { getConfig } from 'lambda-webpack'
import assert from 'assert'
import nodeExternals from 'webpack-node-externals'

const debug = require('debug')('service:getWebpackConfig')

export default function(service, opts = {}) {
  const { ssr } = opts
  const { config } = service

  const afWebpackOpts = service.applyPlugins('modifyAFWebpackOpts', {
    initialValue: {
      cwd: service.cwd
    },
    args: {
      ssr
    }
  })

  assert(
    !('chainConfig' in afWebpackOpts),
    `chainConfig should not supplied in modifyAFWebpackOpts`
  )
  afWebpackOpts.chainConfig = webpackConfig => {
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
      ...afWebpackOpts,
      ssr
    })
  })

  if (ssr) {
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
    webpackConfig.externals = nodeExternals(nodeExternalsOpts)
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
