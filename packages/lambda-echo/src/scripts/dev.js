import fork from 'lambda-service/lib/fork'

const child = fork(require.resolve('./realDev.js'))
child.on('message', data => {
  if (process.send) {
    process.send(data)
  }
})
child.on('exit', code => {
  if (code === 1) {
    process.exit(code)
  }
})

process.on('SIGINT', () => {
  child.kill('SIGINT')
})
