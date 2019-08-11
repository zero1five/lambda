#!/usr/bin/env node

const internal = '../lib'
// 获取默认配置
const getConfig = require(`${internal}/getConfig`)
// 获取用户配置
const getUserConfig = require(`${internal}/getUserConfig`)

const cwd = process.cwd()
const mode = process.argv[2]
process.env.NODE_ENV = mode === 'dev' ? 'development' : 'production'

const webpackConfig = getWebpackConfig()

switch (mode) {
  case 'dev':
    require(`${internal}/dev`)({
      cwd,
      webpackConfig
    })
    break
  case 'build':
    require(`${internal}/build`)({
      cwd,
      webpackConfig
    })
    break
  default:
    console.log()
    console.error(`Unknown command [${process.argv[2]}]`)
    console.log()
}

function getWebpackConfig() {
  const { config: userConfig } = getUserConfig({
    cwd,
    configFile: process.env.CONFIG_FILE || 'webpackrc'
  })
  return getConfig({
    entry: {
      index: './index.js'
    },
    ...userConfig,
    cwd
  })
}
