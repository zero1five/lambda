import assert from 'assert'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'cssPublicPath',
    validate(val: IFWebpackOpts['cssPublicPath']) {
      assert(
        typeof val === 'string',
        `The cssPublicPath config must be String, but got ${val}`
      )
    }
  }
}
