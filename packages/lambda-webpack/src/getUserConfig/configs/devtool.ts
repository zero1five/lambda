import assert from 'assert'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'devtool',
    validate(val: IFWebpackOpts['devtool']) {
      assert(
        typeof val === 'string',
        `The devtool config must be String, but got ${val}`
      )
    }
  }
}
