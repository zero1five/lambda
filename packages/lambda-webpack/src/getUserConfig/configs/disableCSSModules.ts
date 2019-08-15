import assert from 'assert'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'disableCSSModules',
    validate(val: IFWebpackOpts['disableCSSModules']) {
      assert(
        typeof val === 'boolean',
        `The disableCSSModules config must be Boolean, but got ${val}`
      )
    }
  }
}
