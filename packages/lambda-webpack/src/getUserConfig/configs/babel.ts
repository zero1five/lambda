import assert from 'assert'
import { isPlainObject } from 'lodash'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'babel',
    validate(val: IFWebpackOpts['babel']) {
      assert(
        isPlainObject(val),
        `The babel config must be Plain Object, but got ${val}`
      )
    }
  }
}
