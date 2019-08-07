import { getConfig } from 'lambda-webpack'
import assert from 'assert'

export default function(service, opts = {}) {
  const { config } = service

  const afWebpackOpts = service.applyPlugins('modifyAFWebpackOpts', {
    initialValue: {
      cwd: service.cwd
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
      ...afWebpackOpts
    })
  })

  return webpackConfig
}
