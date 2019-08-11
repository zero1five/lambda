import { existsSync } from 'fs'
import { resolve, isAbsolute } from 'path'
import { IFWebpackOpts } from '../../index.d'

export default function(theme, opts: IFWebpackOpts = {}) {
  const { cwd = process.cwd() } = opts
  if (!theme) return {}
  if (typeof theme === 'string') {
    const themePath = isAbsolute(theme) ? theme : resolve(cwd, theme)
    if (existsSync(themePath)) {
      const themeConfig = require(themePath) // eslint-disable-line
      if (typeof themeConfig === 'function') {
        return themeConfig()
      } else {
        return themeConfig
      }
    } else {
      throw new Error(`theme file don't exists`)
    }
  }
  return theme
}
