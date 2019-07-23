const { readdirSync } = require('fs')
const { resolve } = require('path')

const reactDevUtils = () =>
  readdirSync(__dirname).reduce((resolveMap, file) => {
    resolveMap[file] = require(resolve(file))
    return resolveMap
  }, {})

module.exports = reactDevUtils()
