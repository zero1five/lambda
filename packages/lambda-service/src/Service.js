import chalk from 'chalk'
import { join, dirname } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import assert from 'assert'
import mkdirp from 'mkdirp'
import { assign, cloneDeep } from 'lodash'
import { parse } from 'dotenv'
import signale from 'signale'
import { LambdaError, printLambdaError } from '@lambda/core'

// import getPaths from './getPaths'
import UserConfig from './UserConfig'
import getPlugins from './getPlugins'
// import registerBabel from './registerBabel'

const debug = require('debug')('lambda-service:Service')

export default class Service {
  constructor({ cwd }) {
    this.cwd = cwd || process.cwd()

    try {
      this.pkg = require(join(this.cwd, 'package.json'))
    } catch (e) {
      this.pkg = {}
    }

    // registerBabel({
    //   cwd: this.cwd
    // })

    this.commands = {}
    this.pluginHooks = {}
    this.pluginMethods = {}
    this.generators = {}
    this.LambdaError = LambdaError
    this.printLambdaError = printLambdaError

    this.config = UserConfig.getConfig({
      cwd: this.cwd,
      service: this
    })

    debug(`user config: ${JSON.stringify(this.config)}`)

    this.plugins = this.resolvePlugins()
    this.extraPlugins = []
    debug(`plugins: ${this.plugins.map(p => p.id).join(' | ')}`)

    // this.paths = getPaths(this)
  }

  // 初始化
  init() {
    // 加载 Env
    this.loadEnv()

    // 加载 plugins
    this.initPlugins()

    const userConfig = new UserConfig(this)
    const config = userConfig.getConfig({ force: true })
    mergeConfig(this.config, config)
    this.userConfig = userConfig

    debug('got user config')
    debug(this.config)

    // 将用户配置的 output 设置到 Service
    if (config.outputPath) {
      const { paths } = this
      paths.outputPath = config.outputPath
      paths.absOutputPath = join(paths.cwd, config.outputPath)
    }

    debug('got paths')
    debug(this.paths)
  }

  // 调用初始化和调用command plugins
  run(name = 'help', args) {
    this.init()
    return this.runCommand(name, args)
  }

  runCommand(rawName, rawArgs) {
    debug(`raw command name: ${rawName}, args: ${JSON.stringify(rawArgs)}`)

    const { name, args } = this.applyPlugins('_modifyCommand', {
      initialValue: {
        name: rawName,
        args: rawArgs
      }
    })

    debug(`run ${name} with args ${JSON.stringify(args)}`)

    const command = this.commands[name]
    if (!command) {
      signale.error(`Command ${chalk.underline.cyan(name)} does not exists`)
      process.exit(1)
    }

    const { fn, opts } = command
    if (opts.webpack) {
      // webpack config
      this.webpackConfig = require('./getWebpackConfig').default(this)
      if (this.config.ssr) {
        // when use ssr, push client-manifest plugin into client webpackConfig
        this.webpackConfig.plugins.push(
          new (require('./plugins/commands/getChunkMapPlugin').default(this))()
        )
        // server webpack config
        this.ssrWebpackConfig = require('./getWebpackConfig').default(this, {
          ssr: this.config.ssr
        })
      }
    }

    return fn(args)
  }

  applyPlugins(key, opts = {}) {
    debug(`apply plugins ${key}`)
    return (this.pluginHooks[key] || []).reduce((memo, { fn }) => {
      try {
        return fn({
          memo,
          args: opts.args
        })
      } catch (e) {
        console.error(chalk.red(`Plugin apply failed: ${e.message}`))
        throw e
      }
    }, opts.initialValue)
  }

  resolvePlugins() {
    try {
      assert(
        Array.isArray(this.config.plugins || []),
        `Configure item ${chalk.underline.cyan(
          'plugins'
        )} should be Array, but got ${chalk.red(typeof this.config.plugins)}`
      )
      return getPlugins({
        cwd: winPath(this.cwd),
        plugins: this.config.plugins
      })
    } catch (e) {
      if (process.env.UMI_TEST) {
        throw new Error(e)
      } else {
        this.printLambdaError(e)
        process.exit(1)
      }
    }
  }
}
