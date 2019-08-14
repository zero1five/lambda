import assert from 'assert'
import { isPlainObject } from 'lodash'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'cssnano',
    validate(val: IFWebpackOpts['cssnano']) {
      assert(
        isPlainObject(val),
        `The cssnano config must be Plain Object, but got ${val}`
      )
    }
  }
}
