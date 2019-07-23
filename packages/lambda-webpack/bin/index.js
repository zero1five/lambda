#!/usr/bin/env node

const internal = '../lib'
// 获取默认配置
const getConfig = require(`${internal}/getConfig`)
// 获取用户配置
const getUserConfig = require(`${internal}/getUserConfig`)

const cwd = process.cwd()
const webpackConfig = getWebpackConfig()

switch (process.argv[2]) {
  case 'dev':
    require(`${internal}/dev`).default({
      cwd,
      webpackConfig
    })
    break
  case 'build':
    require(`${internal}/build`).default({
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
