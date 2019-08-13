import assert from 'assert'
import { isPlainObject } from 'lodash'
import { IFWebpackOpts } from '../../../index.d'

export default function() {
  return {
    name: 'alias',
    validate(val: IFWebpackOpts['alias']) {
      assert(
        isPlainObject(val),
        `The alias config must be Plain Object, but got ${val}`
      )
    }
  }
}
