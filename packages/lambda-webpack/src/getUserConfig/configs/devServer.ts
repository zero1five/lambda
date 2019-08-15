import assert from 'assert'
import { isPlainObject } from 'lodash'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'devServer',
    validate(val: IFWebpackOpts['devServer']) {
      assert(
        isPlainObject(val),
        `The devServer config must be Plain Object, but got ${val}`
      )
    }
  }
}
