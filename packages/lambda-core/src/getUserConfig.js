import { join, extname } from 'path'
import { existsSync } from 'fs'
import assert from 'assert'
import extend from 'extend2'
import { winPath } from 'umi-utils'

export function getConfigFile(cwd) {
  const files = [
    '.umirc.ts',
    '.umirc.js',
    'config/config.ts',
    'config/config.js'
  ]
  const validFiles = files.filter(f => existsSync(join(cwd, f)))
  assert(
    validFiles.length <= 1,
    `Multiple config files (${validFiles.join(
      ', '
    )}) were detected, please keep only one.`
  )
  if (validFiles[0]) {
    return winPath(join(cwd, validFiles[0]))
  }
}

export function addAffix(file, affix) {
  const ext = extname(file)
  return file.replace(new RegExp(`${ext}$`), `.${affix}${ext}`)
}

function defaultOnError(e) {
  console.error(e)
}

function requireFile(f, opts = {}) {
  if (!existsSync(f)) {
    return {}
  }

  const { onError = defaultOnError } = opts
  let ret = {}
  try {
    ret = require(f) || {} // eslint-disable-line
  } catch (e) {
    onError(e, f)
  }
  // support esm + babel transform
  return ret.default || ret
}

export function mergeConfigs(...configs) {
  return extend(true, ...configs)
}

export function getConfigByConfigFile(configFile, opts = {}) {
  const umiEnv = process.env.UMI_ENV
  const isDev = process.env.NODE_ENV === 'development'
  const { defaultConfig, onError } = opts

  const requireOpts = { onError }
  const configs = [
    defaultConfig,
    requireFile(configFile, requireOpts),
    umiEnv && requireFile(addAffix(configFile, umiEnv), requireOpts),
    isDev && requireFile(addAffix(configFile, 'local'), requireOpts)
  ]
  return mergeConfigs(...configs)
}

export function getConfigPaths(cwd) {
  const env = process.env.UMI_ENV
  return [
    join(cwd, 'config/'),
    join(cwd, '.umirc.js'),
    join(cwd, '.umirc.ts'),
    join(cwd, '.umirc.local.js'),
    join(cwd, '.umirc.local.ts'),
    ...(env
      ? [join(cwd, `.umirc.${env}.js`), join(cwd, `.umirc.${env}.ts`)]
      : [])
  ]
}

export function cleanConfigRequireCache(cwd) {
  const paths = getConfigPaths(cwd)
  Object.keys(require.cache).forEach(file => {
    if (
      paths.some(path => {
        return file.indexOf(path) === 0
      })
    ) {
      delete require.cache[file]
    }
  })
}

export default function(opts = {}) {
  const { cwd, defaultConfig } = opts
  const absConfigFile = getConfigFile(cwd)

  // 一定要主的 config 文件，UMI_ENV 才会生效
  if (absConfigFile) {
    return getConfigByConfigFile(absConfigFile, {
      defaultConfig
    })
  } else {
    return {}
  }
}
