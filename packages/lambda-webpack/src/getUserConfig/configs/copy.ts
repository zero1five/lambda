import assert from 'assert'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'copy',
    validate(val: IFWebpackOpts['copy']) {
      assert(
        Array.isArray(val),
        `The copy config must be Array, but got ${val}`
      )
    }
  }
}
