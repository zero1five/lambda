import { uniq } from 'lodash'
import { winPath } from '@lambda/utils'
import nodeExternals from 'webpack-node-externals'

import getHtmlGenerator from 'lambda-service/lib/plugins/commands/getHtmlGenerator'
import htmlToJSX from 'lambda-service/lib/htmlToJSX'

const debug = require('debug')('ssr:getWebpackConfig')

function getRoutePaths(routes) {
  return uniq(
    routes.reduce((memo, route) => {
      if (route.path) {
        memo.push(route.path)
        if (route.routes) {
          memo = memo.concat(getRoutePaths(route.routes))
        }
      }
      return memo
    }, [])
  )
}

function normalizePath(path, base = '/') {
  if (path.startsWith(base)) {
    path = path.replace(base, '/')
  }
  return path
}

export default function(api, opts) {
  const { externalWhitelist } = opts
  const { service } = api
  // 开启ssr时不设置webpack的optimization.splitChunks
  api.modifyAFWebpackOpts((memo, args) => {
    return {
      ...memo,
      disableDynamicImport: !!opts.ssr
    }
  })

  // 修改ssr开启时webpack的配置
  api.modifyWebpackConfig((webpackConfig, args) => {
    const nodeExternalsOpts = {
      whitelist: [
        /\.(css|less|sass|scss)$/,
        /^umi(\/.*)?$/,
        'umi-plugin-locale',
        ...(externalWhitelist || [])
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

    return webpackConfig
  })

  // ssr时调用app.run | 只初始化不挂载dom
  api.addEntryCodeAhead(`app.router(() => <div />);\napp.run();`)

  // 修改entry.js render content
  api.modifyEntryRender((memo, args) => {
    memo = memo.replace(
      '{{ modifyEntryRender }}',
      `
    if (window.g_useSSR) {
      // 如果开启服务端渲染则客户端组件初始化 props 使用服务端注入的数据
      props = window.g_initialData;
    }
    `.trim()
    )

    return memo
  })

  // 修改entry.js history
  api.modifyEntryHistory((memo, args) => {
    memo = `
    __IS_BROWSER ? ${memo} : require('history').createMemoryHistory()
          `.trim()

    return memo
  })

  // 修改tamplate map
  api.modifyHtmlTemplateMap((memo, args) => {
    const isProd = process.env.NODE_ENV === 'production'
    const { config, RoutesManager } = service
    const routePaths = getRoutePaths(RoutesManager.routes)
    memo = routePaths.map(routePath => {
      let ssrHtml = '<></>'
      const hg = getHtmlGenerator(service, {
        chunksMap: {
          // TODO, for dynamic chunks
          // placeholder waiting manifest
          umi: [
            isProd ? '__UMI_SERVER__.js' : 'umi.js',
            isProd ? '__UMI_SERVER__.css' : 'umi.css'
          ]
        },
        headScripts: [
          {
            content: `
  window.g_useSSR=true;
  window.g_initialData = \${require('${winPath(
    require.resolve('serialize-javascript')
  )}')(props)};
            `.trim()
          }
        ]
      })
      const content = hg.getMatchedContent(
        normalizePath(routePath, config.base)
      )
      ssrHtml = htmlToJSX(content).replace(
        `<div id="${config.mountElementId || 'root'}"></div>`,
        `<div id="${config.mountElementId || 'root'}">{ rootContainer }</div>`
      )
      return `'${routePath}': (${ssrHtml}),`
    })

    return memo
  })
}

/**
 * 将涵盖ssr的代码抽离到这里
 * 配置ssr wepback的支持
 */
