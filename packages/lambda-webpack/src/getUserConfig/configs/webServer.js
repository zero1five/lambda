import assert from 'assert'
import { isPlainObject } from 'lodash'

export default function() {
  return {
    name: 'webServer',
    validate(val) {
      assert(
        isPlainObject(val) || typeof val === 'boolean',
        `The webServer config must be Boolean, but got ${val}`
      )
    }
  }
}
