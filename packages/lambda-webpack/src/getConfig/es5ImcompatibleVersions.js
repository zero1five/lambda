const pkgUp = require('pkg-up')
const { dirname } = require('path')
const { satisfies } = require('semver')

const pkgPathCache = {}
const pkgCache = {}
const {
  config: { 'es5-imcompatible-versions': config }
} = require('es5-imcompatible-versions/package.json')

function getPkgPath(filePath) {
  const dir = dirname(filePath)
  if (dir in pkgPathCache) return pkgPathCache[dir]
  pkgPathCache[dir] = pkgUp.sync({ cwd: filePath })
  return pkgPathCache[dir]
}

function shouldTransform(pkgPath) {
  if (pkgPath in pkgCache) return pkgCache[pkgPath]
  const { name, version } = require(pkgPath)
  pkgCache[pkgPath] = isMatch(name, version)
  return pkgCache[pkgPath]
}

function isMatch(name, version) {
  if (config[name]) {
    return Object.keys(config[name]).some(sv => satisfies(version, sv))
  } else {
    return false
  }
}

module.exports = { getPkgPath, shouldTransform }
