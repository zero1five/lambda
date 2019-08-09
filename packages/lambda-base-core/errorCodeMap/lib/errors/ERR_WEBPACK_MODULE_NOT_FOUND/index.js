const { isWebpackError } = require('../../utils')

module.exports = {
  test({ context }) {
    return !context.dll && isWebpackError(context, 'ModuleNotFoundError')
  }
}
