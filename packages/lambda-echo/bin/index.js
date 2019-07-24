#!/usr/bin/env node

const resolveCwd = require('resolve-cwd')

const localCLI = resolveCwd.silent('lambda-echo/bin')
if (localCLI && localCLI !== __filename) {
  const debug = require('debug')('lambda-echo')
  debug('Using local install of lambda-echo')
  require(localCLI)
} else {
  require('../lib/cli')
}
