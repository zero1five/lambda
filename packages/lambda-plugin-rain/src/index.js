import { join, dirname, basename, extname } from 'path'
import { readFileSync } from 'fs'
import globby from 'globby'
import { findJS, optsToArray } from '@lambda/utils'

function getModel(cwd, api) {
  const { config, winPath } = api

  const modelJSPath = findJS(cwd, 'model')
  if (modelJSPath) {
    return [winPath(modelJSPath)]
  }

  return globby
    .sync(`./${config.singular ? 'model' : 'models'}/**/*.{ts,tsx,js,jsx}`, {
      cwd
    })
    .filter(
      p =>
        !p.endsWith('.d.ts') &&
        !p.endsWith('.test.js') &&
        !p.endsWith('.test.jsx') &&
        !p.endsWith('.test.ts') &&
        !p.endsWith('.test.tsx')
    )
    .map(p => winPath(join(cwd, p)))
}

function getGlobalModels(api) {
  const { paths, routes } = api
  let models = getModel(paths.absSrcPath, api)
  return models
}

export default function(api, opts = {}) {
  const { paths, cwd, compatDirname, winPath } = api

  function getRainJS() {
    const rainJS = findJS(paths.absSrcPath, 'redux-rain')
    if (rainJS) {
      return winPath(rainJS)
    }
  }

  function getModelName(model) {
    const modelArr = winPath(model).split('/')
    return modelArr[modelArr.length - 1]
  }

  function exclude(models, excludes) {
    return models.filter(model => {
      for (const exclude of excludes) {
        if (typeof exclude === 'function' && exclude(getModelName(mode))) {
          return false
        }
        if (exclude instanceof RegExp && exclude.test(getModelName(model))) {
          return false
        }
        return true
      }
    })
  }

  function getGlobalModelContent() {
    return exclude(getGlobalModels(api), optsToArray(opts.exclude))
      .map(path =>
        `
    app.model({ namespace: '${basename(
      path,
      extname(path)
    )}', ...(require('${path}').default) });
  `.trim()
      )
      .join('\r\n')
  }

  const rainDir = compatDirname(
    'redux-rain/package.json',
    cwd,
    process.env.DEFAULT_RAIN_DIR ||
      dirname(require.resolve('redux-rain/package.json'))
  )
  const rainVersion = require(join(rainDir, 'package.json')).version

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
      .replace('<%= RegisterPlugins %>', '')
      .replace('<%= RegisterModels %>', getGlobalModelContent())
    api.writeTmpFile('rain.js', tplContent)
  }

  api.onGenerateFiles(() => {
    generateInitRain()
  })

  api.addVersionInfo([
    `redux-rain@${rainVersion} (${rainDir})`,
    `path-to-regexp@${require('path-to-regexp/package').version}`
  ])

  api.modifyAFWebpackOpts(memo => {
    const alias = {
      ...memo.alias,
      'redux-rain': require.resolve(rainDir),
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

  api.addRuntimePluginKey('redux-rain')

  api.addEntryCodeAhead(
    `
const app = require('@tmp/rain')._onCreate();
${api.config.disableGlobalVariables ? '' : `window.g_app = app;`}
${api.config.ssr ? `app.router(() => <div />);\napp.start();` : ''}
  `.trim()
  )
}
