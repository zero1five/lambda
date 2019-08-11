const { join } = require('path')
const requireindex = require('requireindex')

module.exports = () => {
  const pluginsMap = requireindex(join(__dirname, './configs'))
  return Object.keys(pluginsMap).map(key => {
    return pluginsMap[key].default()
  })
}
