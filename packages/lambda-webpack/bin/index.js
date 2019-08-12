#!/usr/bin/env node
const { getWebpackConfig, fork } = require('./utils')

const cwd = process.cwd()
const mode = process.argv[2]
process.env.NODE_ENV = mode === 'dev' ? 'development' : 'production'

switch (mode) {
  case 'dev':
    fork(`./realDev.js`)
    break
  case 'build':
    require(`../lib/build`)({
      cwd,
      webpackConfig: getWebpackConfig()[0]
    })
    break
  default:
    console.log()
    console.error(`Unknown command [${process.argv[2]}]`)
    console.log()
}
