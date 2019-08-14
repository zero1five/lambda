import assert from 'assert'
import { isPlainObject } from 'lodash'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'cssLoaderOptions',
    validate(val: IFWebpackOpts['cssLoaderOptions']) {
      assert(
        isPlainObject(val),
        `The cssLoaderOptions config must be Plain Object, but got ${val}`
      )
    }
  }
}
