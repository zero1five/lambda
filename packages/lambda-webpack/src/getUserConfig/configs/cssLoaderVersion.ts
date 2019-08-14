import assert from 'assert'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'cssLoaderVersion',
    validate(val: IFWebpackOpts['cssLoaderVersion']) {
      assert(
        typeof val === 'number',
        `The cssLoaderVersion config must be Number, but got ${val}`
      )
      assert(
        val === 1 || val === 2,
        `The cssLoaderVersion config must be 1 or 2, default 1`
      )
    }
  }
}
