#!/usr/bin/env node

// 获取默认配置
const getConfig = require('../src/getConfig')
// 获取用户配置
const getUserConfig = require('../src/getUserConfig')

const cwd = process.cwd()
const webpackConfig = getWebpackConfig()

switch (process.argv[2]) {
  case 'dev':
    require('../dev').default({
      cwd,
      webpackConfig
    })
    break
  case 'build':
    require('../build').default({
      cwd,
      webpackConfig
    })
    break
  default:
    console.error(`Unknown command ${process.argv[2]}`)
}

function getWebpackConfig() {
  const { config: userConfig } = getUserConfig.default({
    cwd,
    configFile: process.env.CONFIG_FILE || '.webpackrc'
  })
  return getConfig.default({
    entry: {
      index: './index.js'
    },
    ...userConfig,
    cwd
  })
}
