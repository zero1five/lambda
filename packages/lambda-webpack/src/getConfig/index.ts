const Config = require('webpack-chain')
const { join, resolve, relative } = require('path')
const { existsSync } = require('fs')
const { EOL } = require('os')
const assert = require('assert')
const { getPkgPath, shouldTransform } = require('./es5ImcompatibleVersions')
const resolveDefine = require('./resolveDefine')
import { IFWebpackOpts } from '../../index.d'

function makeArray(item) {
  if (Array.isArray(item)) return item
  return [item]
}

module.exports = (opts: IFWebpackOpts) => {
  const { cwd = process.cwd() } = opts || {}
  // 通过env变量判断是否是dev模式
  const isDev = process.env.NODE_ENV === 'development'

  const webpackConfig = new Config()

  webpackConfig.mode('development')

  // 配置 entry
  if (opts.entry) {
    if (typeof opts.entry === 'string') {
      webpackConfig.entry('index').add(opts.entry)
    } else {
      for (const key in opts.entry) {
        // 配置对应的 entry key:value
        const entry = webpackConfig.entry(key)
        makeArray(opts.entry[key]).forEach(file => {
          entry.add(file)
        })
      }
    }
  }

  // 配置 output
  const absOutputPath = resolve(cwd, opts.outputPath || 'dist')
  webpackConfig.output
    .path(absOutputPath)
    .filename('[name].js')
    .chunkFilename('[name].async.js')
    .publicPath(opts.publicPath)
    .devtoolModuleFilenameTemplate(info => {
      return relative(cwd, info.absoluteResourcePath).replace(/\\/g, '/')
    })

  // 配置 resolve 模块解析路径配置
  webpackConfig.resolve
    .set('symlinks', true)
    .modules.add('node_modules')
    .add(join(__dirname, '../../node_modules'))
    .add(join(__dirname, '../../../'))
    .end()
    .extensions.merge([
      '.web.js',
      '.wasm',
      '.mjs',
      '.js',
      '.web.jsx',
      '.jsx',
      '.web.ts',
      '.ts',
      '.web.tsx',
      '.tsx',
      '.json'
    ])

  // 配置别名
  if (opts.alias) {
    for (const key in opts.alias) {
      webpackConfig.resolve.alias.set(key, opts.alias[key])
    }
  }

  // 配置 webpack loader 解析路径
  webpackConfig.resolveLoader.modules
    .add('node_modules')
    .add(join(__dirname, '../../node_modules'))
    .end()

  // TODO: Whether to remove
  if (!opts.disableDynamicImport) {
    webpackConfig.optimization
      .splitChunks({
        chunks: 'async',
        name: 'vendors'
      })
      .runtimeChunk(false)
  }

  // 配置不解析项
  const DEFAULT_INLINE_LIMIT = 10000
  const rule = webpackConfig.module
    .rule('exclude')
    .exclude.add(/\.json$/)
    .add(/\.(js|jsx|ts|tsx|mjs|wasm)$/)
    .add(/\.(graphql|gql)$/)
    .add(/\.(css|less|scss|sass)$/)
  if (opts.urlLoaderExcludes) {
    opts.urlLoaderExcludes.forEach(exclude => {
      rule.add(exclude)
    })
  }
  rule
    .end()
    .use('url-loader')
    // TODO: Whether to remove
    .loader(require.resolve('umi-url-pnp-loader'))
    .options({
      limit: opts.inlineLimit || DEFAULT_INLINE_LIMIT,
      name: 'static/[name].[hash:8].[ext]'
    })

  const babelOptsCommon = {
    sourceType: 'unambiguous',
    cacheDirectory: process.env.BABEL_CACHE !== 'none',
    babelrc: !!process.env.BABELRC,
    customize: require.resolve('babel-preset-umi/lib/webpack-overrides')
  }
  const babel = opts.babel || {}
  const babelOpts = {
    presets: [...(babel.presets || [])],
    plugins: [
      ...(babel.plugins || []),
      [
        require.resolve('babel-plugin-named-asset-import'),
        {
          loaderMap: {
            svg: {
              ReactComponent: `${require.resolve(
                '../svgr'
              )}?-prettier,-svgo![path]`
            }
          }
        }
      ]
    ],
    ...babelOptsCommon
  }

  if (opts.disableDynamicImport) {
    babelOpts.plugins = [
      ...(babelOpts.plugins || []),
      require.resolve('babel-plugin-dynamic-import-node')
    ]
  }

  // TODO: Whether to remove
  if (process.env.ESLINT && process.env.ESLINT !== 'none') {
    require('./eslint').default(webpackConfig, opts)
  }

  // Avoid "require is not defined" errors
  webpackConfig.module
    .rule('mjs-require')
    .test(/\.mjs$/)
    .type('javascript/auto')
    .include.add(opts.cwd)

  // 解析 .mjs
  webpackConfig.module
    .rule('mjs')
    .test(/\.mjs$/)
    .include.add(opts.cwd)
    .end()
    .use('babel-loader')
    .loader(require.resolve('babel-loader'))
    .options(babelOpts)

  // 解析 .js
  webpackConfig.module
    .rule('js')
    .test(/\.js$/)
    .include.add(opts.cwd)
    .end()
    .exclude.add(/node_modules/)
    .end()
    .use('babel-loader')
    .loader(require.resolve('babel-loader'))
    .options(babelOpts)

  // 解析 .jsx
  webpackConfig.module
    .rule('jsx')
    .test(/\.jsx$/)
    .include.add(opts.cwd)
    .end()
    .use('babel-loader')
    .loader(require.resolve('babel-loader'))
    .options(babelOpts)

  // module -> extraBabelIncludes
  const extraBabelIncludes = (opts.extraBabelIncludes || []).concat(a => {
    if (!a.includes('node_modules')) return false
    const pkgPath = getPkgPath(a)
    return shouldTransform(pkgPath)
  })
  extraBabelIncludes.forEach((include, index) => {
    const rule = `extraBabelInclude_${index}`
    webpackConfig.module
      .rule(rule)
      .test(/\.jsx?$/)
      .include.add(include)
      .end()
      .use('babel-loader')
      .loader(require.resolve('babel-loader'))
      .options(babelOpts)
  })

  // 解析 .tsx
  const tsConfigFile = opts.tsConfigFile || join(opts.cwd, 'tsconfig.json')
  webpackConfig.module
    .rule('ts')
    .test(/\.tsx?$/)
    .use('babel-loader')
    .loader(require.resolve('babel-loader'))
    .options(babelOpts)
    .end()
    .use('ts-loader')
    .loader(require.resolve('ts-loader'))
    .options({
      configFile: tsConfigFile,
      transpileOnly: true,
      // ref: https://github.com/TypeStrong/ts-loader/blob/fbed24b/src/utils.ts#L23
      errorFormatter(error, colors) {
        const messageColor =
          error.severity === 'warning' ? colors.bold.yellow : colors.bold.red
        return (
          colors.grey('[tsl] ') +
          messageColor(error.severity.toUpperCase()) +
          (error.file === ''
            ? ''
            : messageColor(' in ') +
              colors.bold.cyan(
                `${relative(cwd, join(error.context, error.file))}(${
                  error.line
                },${error.character})`
              )) +
          EOL +
          messageColor(`      TS${error.code}: ${error.content}`)
        )
      },
      ...(opts.typescript || {})
    })

  // 解析 .graphql
  webpackConfig.module
    .rule('graphql')
    .test(/\.(graphql|gql)$/)
    .exclude.add(/node_modules/)
    .end()
    .use('graphql-tag-loader')
    .loader('graphql-tag/loader')

  // 解析 .css
  require('./css').default(webpackConfig, opts)

  webpackConfig
    .plugin('define')
    .use(require('webpack/lib/DefinePlugin'), [resolveDefine(opts)])

  // 配置 process show
  const NO_PROGRESS = process.env.PROGRESS === 'none'
  if (!process.env.__FROM_UMI_TEST) {
    if (!process.env.CI && !NO_PROGRESS) {
      if (process.platform === 'win32') {
        webpackConfig
          .plugin('progress')
          .use(require('progress-bar-webpack-plugin'))
      } else {
        webpackConfig.plugin('progress').use(require('webpackbar'), [
          {
            color: 'green',
            reporters: ['fancy']
          }
        ])
      }
    }
  }

  // 配置 忽略 moment.js locale 文件
  if (opts.ignoreMomentLocale) {
    webpackConfig
      .plugin('ignore-moment-locale')
      .use(require('webpack/lib/IgnorePlugin'), [/^\.\/locale$/, /moment$/])
  }

  // 配置 ANALYZE-loader
  if (process.env.ANALYZE) {
    webpackConfig
      .plugin('bundle-analyzer')
      .use(require('umi-webpack-bundle-analyzer').BundleAnalyzerPlugin, [
        {
          analyzerMode: process.env.ANALYZE_MODE || 'server',
          analyzerPort: process.env.ANALYZE_PORT || 8888,
          openAnalyzer: true,
          // generate stats file while ANALYZE_DUMP exist
          generateStatsFile: !!process.env.ANALYZE_DUMP,
          statsFilename: process.env.ANALYZE_DUMP || 'stats.json'
        }
      ])
  }

  // 配置 生成分析报告
  if (process.env.ANALYZE_REPORT) {
    webpackConfig
      .plugin('bundle-analyzer-reporter')
      .use(require('umi-webpack-bundle-analyzer').BundleAnalyzerPlugin, [
        {
          analyzerMode: 'disabled', // 关闭 analyzer server
          generateReportFile: true, // 开启报告生成功能
          reportDepth: 2, // 裁剪深度 2
          reportDir: process.cwd(),
          statsFilename: process.env.ANALYZE_DUMP || 'bundlestats.json' // 默认生成到 bundlestats.json
        }
      ])
  }

  if (process.env.DUPLICATE_CHECKER) {
    webpackConfig
      .plugin('duplicate-package-checker')
      .use(require('duplicate-package-checker-webpack-plugin'))
  }

  if (process.env.FORK_TS_CHECKER) {
    webpackConfig
      .plugin('fork-ts-checker')
      .use(require('fork-ts-checker-webpack-plugin'), [
        {
          formatter: 'codeframe'
        }
      ])
  }

  if (process.env.FORK_TS_CHECKER) {
    webpackConfig
      .plugin('fork-ts-checker')
      .use(require('fork-ts-checker-webpack-plugin'), [
        {
          formatter: 'codeframe'
        }
      ])
  }

  // 配置 copy-plugin
  if (existsSync(join(opts.cwd, 'public'))) {
    webpackConfig.plugin('copy-public').use(require('copy-webpack-plugin'), [
      [
        {
          from: join(opts.cwd, 'public'),
          to: absOutputPath,
          toType: 'dir'
        }
      ]
    ])
  }

  if (opts.copy) {
    makeArray(opts.copy).forEach((copy, index) => {
      if (typeof copy === 'string') {
        copy = {
          from: join(opts.cwd, copy),
          to: absOutputPath
        }
      }
      webpackConfig
        .plugin(`copy-${index}`)
        .use(require('copy-webpack-plugin'), [[copy]])
    })
  }

  if (!process.env.__FROM_UMI_TEST) {
    // filter `Conflicting order between` warning
    webpackConfig
      .plugin('filter-css-conflicting-warnings')
      .use(require('./FilterCSSConflictingWarning').default)

    // plugins -> friendly-errors
    const { CLEAR_CONSOLE = 'none' } = process.env
    webpackConfig
      .plugin('friendly-errors')
      .use(require('friendly-errors-webpack-plugin'), [
        {
          clearConsole: CLEAR_CONSOLE !== 'none'
        }
      ])
  }

  if (opts.externals) {
    webpackConfig.externals(opts.externals)
  }

  // node
  webpackConfig.node.merge({
    setImmediate: false,
    process: 'mock',
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  })

  if (isDev) {
    require('./dev').default(webpackConfig, opts)
  } else {
    require('./prod').default(webpackConfig, opts)
  }

  if (opts.chainConfig) {
    assert(
      typeof opts.chainConfig === 'function',
      `opts.chainConfig should be function, but got ${opts.chainConfig}`
    )
    opts.chainConfig(webpackConfig)
  }
  let config = webpackConfig.toConfig()
  if (process.env.SPEED_MEASURE && !opts.ssr) {
    const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
    const smpOption =
      process.env.SPEED_MEASURE === 'CONSOLE'
        ? { outputFormat: 'human', outputTarget: console.log }
        : {
            outputFormat: 'json',
            outputTarget: join(process.cwd(), 'speed-measure.json')
          }
    const smp = new SpeedMeasurePlugin(smpOption)
    config = smp.wrap(config)
  }
  return config
}
