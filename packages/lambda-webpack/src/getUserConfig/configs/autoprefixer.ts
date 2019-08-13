import assert from 'assert'
import { isPlainObject } from 'lodash'
import { IFWebpackOpts } from '../../../index.d'

export default function() {
  return {
    name: 'autoprefixer',
    validate(val: IFWebpackOpts['autoprefixer']) {
      assert(
        isPlainObject(val),
        `The autoprefixer config must be Plain Object, but got ${val}`
      )
    }
  }
}
