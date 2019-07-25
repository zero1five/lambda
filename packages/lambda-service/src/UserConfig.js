import { join } from 'path'
import requireindex from 'requireindex'
import chalk from 'chalk'
import didyoumean from 'didyoumean'
import { cloneDeep } from 'lodash'
import signale from 'signale'
import getUserConfig, {
  getConfigPaths,
  getConfigFile,
  getConfigByConfigFile,
  cleanConfigRequireCache
} from 'lambda-core/lib/getUserConfig'
import { watch, unwatch } from './getConfig/watch'
import { isEqual } from './utils'

export default class UserConfig {
  static getConfig(opts = {}) {
    const { cwd, service } = opts

    return getUserConfig({
      cwd,
      defaultConfig: service.applyPlugins('modifyDefaultConfig', {
        initialValue: {}
      })
    })
  }

  constructor(service) {
    this.service = service
    this.configFailed = false
    this.config = null
    this.file = null
    this.relativeFile = null
    this.watch = watch
    this.unwatch = unwatch
    this.initConfigPlugins()
  }

  initConfigPlugins() {
    const map = requireindex(join(__dirname, 'getConfig/configPlugins'))
    let plugins = Object.keys(map).map(key => {
      return map[key].default
    })
    plugins = this.service.applyPlugins('_registerConfig', {
      initialValue: plugins
    })
    this.plugins = plugins.map(p => p(this))
  }
}
