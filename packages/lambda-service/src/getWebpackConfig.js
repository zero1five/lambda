import { getConfig } from 'lambda-webpack'
import assert from 'assert'

export default function(service, opts = {}) {
  const { config } = service

  const webpackOpts = service.applyPlugins('modifyAFWebpackOpts', {
    initialValue: {
      cwd: service.cwd
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
      ...webpackOpts
    })
  })

  return webpackConfig
}
