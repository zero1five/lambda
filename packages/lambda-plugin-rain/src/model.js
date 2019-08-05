import { join } from 'path'
import assert from 'assert'

export default api => {
  const { paths, config } = api
  const absTemplatePath = join(__dirname, '../template/generators')

  return class Generator extends api.Generator {
    writing() {
      // 当routes存在时
      if (config.routes) {
        throw new Error(`lambda g page does not work when config.routes exists`)
      }

      // 通过singular判断 models dir name
      const models = config.singular ? 'model' : 'models'
      const name = this.args[0].toString()
      assert(
        !name.includes('/'),
        `model name should not contains /, bug got ${name}`
      )

      this.fs.copyTpl(
        join(absTemplatePath, 'model.js'),
        join(paths.absSrcPath, models, `${name}.js`),
        {
          name
        }
      )
    }
  }
}
