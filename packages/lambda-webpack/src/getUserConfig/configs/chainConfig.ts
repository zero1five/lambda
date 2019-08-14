import assert from 'assert'
import { IFWebpackOpts } from '../../..'

export default function() {
  return {
    name: 'chainConfig',
    validate(val: IFWebpackOpts['chainConfig']) {
      assert(
        typeof val === 'function',
        `The chainConfig config must be Function, but got ${val}`
      )
    }
  }
}
