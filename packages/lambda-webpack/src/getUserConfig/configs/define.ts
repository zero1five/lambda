import assert from 'assert'
import { isPlainObject } from 'lodash'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'define',
    validate(val: IFWebpackOpts['define']) {
      assert(
        isPlainObject(val),
        `The define config must be Plain Object, but got ${val}`
      )
    }
  }
}
