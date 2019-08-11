import * as IWebpackChainConfig from 'webpack-chain'

export { IWebpackChainConfig }

type WhitelistOption = string | RegExp

type ISSROpts =
  | {
      /** not external library */
      externalWhitelist?: WhitelistOption[]
      /** client manifest, default: ssr-client-mainifest.json */
      manifestFileName?: string
      /** disable ssr external */
      disableExternal?: boolean
    }
  | boolean

type CSSModuleExcludes = string[] | RegExp[]

type styleLoaderOpts = {
  base?: number
}

type BabelOpts = {
  presets?: (string | object)[]
  plugins?: (string | object)[]
}

export interface IFWebpackOpts {
  // 禁用 CSS 的 SourceMap 生成
  disableCSSSourceMap?: boolean
  // css-loader 的额外配置
  cssLoaderOptions?: object
  // less theme 配置, 可以是文件路径也可以是对象
  // http://lesscss.org/usage/#using-less-in-the-browser-modify-variables
  theme?: string | object
  lessLoaderOptions?: object
  // target browsers list
  // https://github.com/postcss/autoprefixer#options
  browserslist?: string[]
  // autoprefixer options
  autoprefixer?: object
  // extra postcss plugins
  extraPostCSSPlugins?: []
  // compress css presets
  // https://cssnano.co/guides/presets
  cssnano?: object
  // disable css compress
  disableCSSCompress?: boolean
  // ssr config
  ssr?: ISSROpts
  // use or not style-loader, when not use ssr
  styleLoader?: styleLoaderOpts
  // mini-css-extract-plugin public path
  cssPublicPath?: string
  cssLoaderVersion?: 1 | 2
  // https://github.com/sass/node-sass#options
  sass?: object
  // exclude css modules
  cssModulesExcludes?: CSSModuleExcludes
  // disable CSS modules
  disableCSSModules?: boolean
  // file hash suffix
  hash?: boolean
  // webpack devtool
  devtool?: IWebpackChainConfig.DevTool
  // webpack DevServer
  devServer?: IWebpackChainConfig.DevServer
  // node current work dir
  cwd?: string
  // webpack DefinePlugin
  define?: object
  // webapck entry
  entry?: string | object
  // outputPath
  outputPath?: string
  // output public path
  publicPath?: string
  // webpack alias
  // https://webpack.js.org/configuration/resolve/#resolvealias
  alias?: object
  // 禁用异步分块（按需加载）
  disableDynamicImport?: boolean
  // urlLoaderExcludes
  urlLoaderExcludes?: object[]
  // url-loader inlineLimit
  inlineLimit?: number
  // babel === babelrc.js
  babel?: BabelOpts
  // extra JSX babel include
  extraBabelIncludes?: object[]
  // ts config file path
  tsConfigFile?: string
  // ts-loader options
  typescript?: object
  // This option is very needed, why: Touch the file system during the build phase
  // https://github.com/webpack-contrib/copy-webpack-plugin
  copy?: object
  // webpack externals
  externals?: object
  // chain to webapck config
  chainConfig?: Function
}
