import chalk from 'chalk'
import signale from 'signale'
import marked from 'marked'
import TerminalRenderer from 'marked-terminal'

marked.setOptions({
  renderer: new TerminalRenderer()
})

const ERROR_CODE_MAP = require('../errorCodeMap')

class LambdaError extends Error {
  constructor(opts, ...params) {
    const { message, code, context } = opts
    super(message, ...params)
    this.code = code
    this.context = context || {}

    this.test()
  }

  test() {
    if (this.code) {
      return
    }
    for (const c of Object.keys(ERROR_CODE_MAP)) {
      const { test } = ERROR_CODE_MAP[c]
      if (test && test({ error: this, context: this.context })) {
        this.code = c
        break
      }
    }
  }
}

function printLambdaError(e, opts = {}) {
  if (!(e instanceof LambdaError)) {
    signale.error(e)
    return
  }

  const { detailsOnly } = opts
  const { code } = e

  if (!code) return

  const { message, details } = ERROR_CODE_MAP[code]
  console.error(`\n${chalk.bgRed.black(' ERROR CODE ')} ${chalk.red(code)}`)

  if (!detailsOnly) {
    console.error(
      `\n${chalk.bgRed.black(' ERROR ')} ${chalk.red(e.message || message)}`
    )
  }

  const osLocale = require('os-locale')
  const lang = osLocale.sync()

  if (lang === 'zh-CN') {
    console.error(
      `\n${chalk.bgMagenta.black(' DETAILS ')}\n\n${marked(details['zh-CN'])}`
    )
  } else {
    console.error(
      `\n${chalk.bgMagenta.black(' DETAILS ')}\n\n${marked(details.en)}`
    )
  }

  if (!detailsOnly && e.stack) {
    console.error(
      `${chalk.bgRed.black(' STACK ')}\n\n${e.stack
        .split('\n')
        .slice(1)
        .join('\n')}`
    )
  }
}

module.exports = { LambdaError, printLambdaError }
