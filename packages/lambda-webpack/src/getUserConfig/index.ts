const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')
const assert = require('assert')
const stripJsonComments = require('strip-json-comments')
const didyoumean = require('didyoumean')
const chalk = require('chalk')
const signale = require('signale')
const { isPlainObject, isEqual } = require('lodash')
const { clearConsole } = require('../reactDevUtils')
const { watch, unwatch } = require('./watch')
const getPlugins = require('./getPlugins')
import { IFWebpackOpts, UserConfigOpts } from '../../index.d'

const debug = require('debug')('lambda-webpack:getUserConfig')

const plugins = getPlugins()
const pluginNames = plugins.map(p => p.name)
const pluginsMapByName = plugins.reduce((memo, p) => {
  memo[p.name] = p
  return memo
}, {})

let devServer = null
const USER_CONFIGS = 'USER_CONFIGS'

function throwError(msg) {
  printError(msg)
  throw new Error(msg)
}

function printError(messages) {
  if (devServer) {
    devServer.sockWrite(
      devServer.sockets,
      'errors',
      typeof messages === 'string' ? [messages] : messages
    )
  }
}

function reload() {
  devServer.sockWrite(devServer.sockets, 'content-changed')
}

function restart(why) {
  clearConsole()
  signale.pending(
    `Since ${chalk.cyan.underline(why)} changed, try to restart server.`
  )
  unwatch()
  devServer.close()
  process.send({ type: 'RESTART' })
}

function merge(oldObj, newObj) {
  for (const key in newObj) {
    if (Array.isArray(newObj[key]) && Array.isArray(oldObj[key])) {
      oldObj[key] = oldObj[key].concat(newObj[key])
    } else if (isPlainObject(newObj[key]) && isPlainObject(oldObj[key])) {
      oldObj[key] = Object.assign(oldObj[key], newObj[key])
    } else {
      oldObj[key] = newObj[key]
    }
  }
}

function replaceNpmVariables(value, pkg) {
  if (typeof value === 'string') {
    return value
      .replace('$npm_package_name', pkg.name)
      .replace('$npm_package_version', pkg.version)
  } else {
    return value
  }
}

const getUserConfig = (opts: UserConfigOpts = {}) => {
  const { cwd, configFile, disabledConfigs = [], preprocessor } = opts

  const rcFile = resolve(cwd, configFile)
  const jsRCFile = resolve(cwd, `${configFile}.js`)

  assert(
    !(existsSync(rcFile) && existsSync(jsRCFile)),
    `${configFile} file and ${configFile}.js file can not exist at the same time.`
  )

  let config: IFWebpackOpts = {}
  if (existsSync(rcFile)) {
    config = JSON.parse(stripJsonComments(readFileSync(rcFile, 'utf-8')))
  }
  if (existsSync(jsRCFile)) {
    // no cache
    delete require.cache[jsRCFile]
    config = require(jsRCFile)
    if (config['default']) {
      config = config['default']
    }
  }

  // TODO: Whether to remove
  if (typeof preprocessor === 'function') {
    config = preprocessor(config)
  }

  const context = {
    cwd
  }

  let errorMsg = null

  Object.keys(config).forEach(key => {
    if (disabledConfigs.includes(key)) {
      errorMsg = `Configuration item ${key} is disabled, please remove it.`
    }
    if (!pluginNames.includes(key)) {
      const guess = didyoumean(key, pluginNames)
      const affix = guess ? `do you meen ${guess} ?` : 'please remove it.'
      errorMsg = `Configuration item ${key} is not valid, ${affix}`
    } else {
      // run config plugin's validate
      const plugin = pluginsMapByName[key]
      if (plugin.validate) {
        try {
          plugin.validate.call(context, config[key])
        } catch (e) {
          errorMsg = e.message
        }
      }
    }
  })

  if (errorMsg) {
    if (/* from watch */ opts.setConfig) {
      opts.setConfig(config)
    }
    throwError(errorMsg)
  }

  if (config.env) {
    if (config.env[process.env.NODE_ENV]) {
      merge(config, config.env[process.env.NODE_ENV])
    }
    delete config.env
  }

  const pkgFile = resolve(cwd, 'package.json')
  if (Object.keys(config).length && existsSync(pkgFile)) {
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'))
    config = Object.keys(config).reduce((memo, key) => {
      memo[key] = replaceNpmVariables(config[key], pkg)
      return memo
    }, {})
  }

  let configFailed = false
  function watchConfigsAndRun(_devServer, watchOpts = {}) {
    devServer = _devServer

    const watcher = watchConfigs(opts)
    if (watcher) {
      watcher.on('all', () => {
        try {
          const { config: newConfig } = getUserConfig({
            ...opts,
            setConfig(newConfig) {
              config = newConfig
            }
          })

          if (configFailed) {
            configFailed = false
            reload()
          }

          for (const plugin of plugins) {
            const { name, onChange } = plugin

            if (!isEqual(newConfig[name], config[name])) {
              debug(
                `Config ${name} changed, from ${JSON.stringify(
                  config[name]
                )} to ${JSON.stringify(newConfig[name])}`
              )
              ;(onChange || restart.bind(null, `${name}`)).call(null, {
                name,
                val: config[name],
                newVal: newConfig[name],
                config,
                newConfig
              })
            }
          }
        } catch (e) {
          configFailed = true
          console.error(chalk.red(`Watch handler failed, since ${e.message}`))
          console.error(e)
        }
      })
    }
  }

  debug(`UserConfig: ${JSON.stringify(config)}`)

  return { config, watch: watchConfigsAndRun }
}

const watchConfigs = (opts: UserConfigOpts = {}) => {
  const { cwd = process.cwd(), configFile = '.webpackrc' } = opts

  const rcFile = resolve(cwd, configFile)
  const jsRCFile = resolve(cwd, `${configFile}.js`)

  return watch(USER_CONFIGS, [rcFile, jsRCFile])
}

const unwatchConfigs = () => {
  unwatch(USER_CONFIGS)
}

module.exports = getUserConfig
exports.watchConfigs = watchConfigs
exports.unwatchConfigs = unwatchConfigs
