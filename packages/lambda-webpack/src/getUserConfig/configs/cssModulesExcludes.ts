import assert from 'assert'
import { extname } from 'path'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'cssModulesExcludes',
    validate(val: IFWebpackOpts['cssModulesExcludes']) {
      assert(
        Array.isArray(val),
        `The cssModulesExcludes config must be Array, but got ${val}`
      )
      val.forEach(file => {
        const ext = extname(file).toLowerCase()
        assert(
          ext === '.css' || ext === '.less',
          `Items in the cssModulesExcludes config must end with .css or .less, but got ${file}`
        )
      })
    }
  }
}
