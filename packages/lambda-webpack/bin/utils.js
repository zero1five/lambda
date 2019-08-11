const cwd = process.cwd()
const internal = '../lib'
// 获取默认配置
const getConfig = require(`${internal}/getConfig`)
// 获取用户配置
const getUserConfig = require(`${internal}/getUserConfig`)

const _fork = require('../lib/fork')

const fork = scriptPath => {
  const child = _fork(require.resolve(scriptPath))
  child.on('message', data => {
    if (process.send) {
      process.send(data)
    }
  })
  child.on('exit', code => {
    if (code === 1) {
      process.exit(code)
    }
  })
  process.on('SIGINT', () => {
    child.kill('SIGINT')
  })
}

function getWebpackConfig() {
  const { config: userConfig, watch } = getUserConfig({
    cwd,
    configFile: process.env.CONFIG_FILE || 'webpackrc'
  })
  return [
    getConfig({
      entry: {
        index: './index.js'
      },
      ...userConfig,
      cwd
    }),
    watch
  ]
}

module.exports = { getWebpackConfig, fork }
