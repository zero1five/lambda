import assert from 'assert'
import { isPlainObject } from 'lodash'

export default function(api) {
  return {
    name: 'dynamicImport',
    validate(val) {
      assert(
        isPlainObject(val) || typeof val === 'boolean',
        `Configure item dynamicImport should be Boolean or Plain Object, but got ${val}.`
      )
    },
    onChange() {
      api.service.restart(/* why */ 'Configure item dynamicImport Changed.')
    }
  }
}
