import { join, basename } from 'path'
import randomColor from 'random-color'
import assert from 'assert'
import chalk from 'chalk'

export default api => {
  const { paths, config, log } = api
  return class Generator extends api.Generator {
    constructor(args, options) {
      super(args, options)

      assert(
        typeof this.args[0] === 'string',
        `
${chalk.underline.cyan('name')} should be supplied

Example:

  umi g page users
        `.trim()
      )
      if (config.routes) {
        log.warn(
          `You should config the routes in config.routes manunally since ${chalk.red(
            'config.routes'
          )} exists`
        )
        console.log()
      }
    }

    writing() {
      const path = this.args[0].toString()
      const jsxExt = this.isTypeScript ? 'tsx' : 'js'
      const cssExt = this.options.less ? 'less' : 'css'
      const context = {
        name: basename(path),
        color: randomColor().hexString(),
        isTypeScript: this.isTypeScript,
        cssExt,
        jsxExt
      }
      this.fs.copyTpl(
        this.templatePath('page.js.tpl'),
        join(paths.absPagesPath, path, `index.${jsxExt}`),
        context
      )
      this.fs.copyTpl(
        this.templatePath('page.css.tpl'),
        join(paths.absPagesPath, path, `index.${cssExt}`),
        context
      )
    }
  }
}
