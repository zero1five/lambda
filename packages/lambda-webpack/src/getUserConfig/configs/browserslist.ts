import assert from 'assert'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'browserslist',
    validate(val: IFWebpackOpts['browserslist']) {
      assert(
        Array.isArray(val),
        `The browserslist config must be Array, but got ${val}`
      )
    }
  }
}
