import { dirname } from 'path'
import { readFileSync } from 'fs'

export default function(api, opts = {}) {
  const { paths, cwd, compatDirname } = api

  const rainDir = compatDirname(
    'rainjs/package.json',
    cwd,
    process.env.DEFAULT_RAIN_DIR ||
      dirname(require.resolve('rainjs/package.json'))
  )

  function generateInitRain() {
    const tpl = join(__dirname, '../template/rain.js.tpl')
    let tplContent = readFileSync(tpl, 'utf-8')
    const rainJS = getRainJS()
    if (rainJS) {
      tplContent = tplContent.replace(
        '<%= ExtendvRainConfig %>',
        `
...((require('${rainJS}').config || (() => ({})))()),
        `.trim()
      )
    }
    tplContent = tplContent
      .replace('<%= ExtendRainConfig %>', '')
      .replace('<%= EnhanceApp %>', '')
      .replace('<%= RegisterPlugins %>', getPluginContent())
      .replace('<%= RegisterModels %>', getGlobalModelContent())
    api.writeTmpFile('rain.js', tplContent)
  }

  api.onGenerateFiles(() => {
    generateInitRain()
  })

  api.modifyAFWebpackOpts(memo => {
    const alias = {
      ...memo.alias,
      rain: rainDir,
      'path-to-regexp': require.resolve('path-to-regexp'),
      'object-assign': require.resolve('object-assign'),
      ...(opts.immer
        ? {
            immer: require.resolve('immer')
          }
        : {})
    }

    return {
      ...memo,
      alias
    }
  })

  api.addPageWatcher([
    join(paths.absSrcPath, 'models'),
    join(paths.absSrcPath, 'plugins'),
    join(paths.absSrcPath, 'model.js'),
    join(paths.absSrcPath, 'model.jsx'),
    join(paths.absSrcPath, 'model.ts'),
    join(paths.absSrcPath, 'model.tsx'),
    join(paths.absSrcPath, 'rain.js'),
    join(paths.absSrcPath, 'rain.jsx'),
    join(paths.absSrcPath, 'rain.ts'),
    join(paths.absSrcPath, 'rain.tsx')
  ])

  api.addRuntimePlugin(join(__dirname, './runtime'))
  api.addRuntimePluginKey('rain')
  api.addEntryCodeAhead(
    `
const app = require('@tmp/rain')._onCreate();
${api.config.disableGlobalVariables ? '' : `window.g_app = app;`}
${api.config.ssr ? `app.router(() => <div />);\napp.start();` : ''}
  `.trim()
  )
}
