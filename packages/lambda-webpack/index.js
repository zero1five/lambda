const fork = require('./lib/fork')
const registerBabel = require('./lib/registerBabel')
const getConfig = require('./lib/getConfig')
const getUserConfig = require('./lib/getUserConfig')
const getUserConfigPlugins = require('./lib/getUserConfig/getPlugins')

const webpack = require('webpack')
const webpackChain = require('webpack-chain')
const webpackDevMiddleware = require('webpack-dev-middleware')

module.exports = {
  fork,
  registerBabel,
  getConfig,
  getUserConfig,
  getUserConfigPlugins,
  webpack,
  'webpack-chain': webpackChain,
  'webpack-dev-middleware': webpackDevMiddleware
}
