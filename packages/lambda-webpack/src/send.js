const debug = require('debug')('lambda-webpack:send')

exports.DONE = 'DONE'
exports.STARTING = 'STARTING'
exports.RESTART = 'RESTART'

module.exports = function send(message) {
  if (process.send) {
    debug(`send ${JSON.stringify(message)}`)
    process.send(message)
  }
}
