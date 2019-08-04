import { join, dirname, basename, extname } from 'path'
import { readFileSync } from 'fs'
import globby from 'globby'
import isRoot from 'path-is-root'
import { chunkName, findJS, optsToArray, endWithSlash } from '@lambda/utils'

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

function getPageModels(cwd, api) {
  let models = []
  while (!isSrcPath(cwd, api) && !isRoot(cwd)) {
    models = models.concat(getModel(cwd, api))
    cwd = dirname(cwd)
  }
  return models
}

function isSrcPath(path, api) {
  const { paths, winPath } = api
  return endWithSlash(winPath(path)) === endWithSlash(winPath(paths.absSrcPath))
}

function getGlobalModels(api) {
  const { paths, routes } = api
  let models = getModel(paths.absSrcPath, api)
  return models
}

function handleDependencyImport(api, { shouldImportDynamic }) {
  // let modifyRouterRootComponentValue = `require('dva/router').routerRedux.ConnectedRouter`
  let addRouterImportValue = shouldImportDynamic
    ? {
        source: 'rain/dynamic',
        specifier: '_rainDynamic'
      }
    : null

  if (addRouterImportValue) {
    api.addRouterImport(addRouterImportValue)
  }
  // api.modifyRouterRootComponent(modifyRouterRootComponentValue)
}

export default function(api, opts = {}) {
  const { paths, cwd, compatDirname, winPath } = api
  const shouldImportDynamic = opts.dynamicImport

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
      }
      return true
    })
  }

  function getGlobalModelContent() {
    return exclude(getGlobalModels(api), optsToArray(opts.exclude))
      .map(path =>
        `
    app.model(require('${path}').default, '${basename(path, extname(path))}');
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

  handleDependencyImport(api, { shouldImportDynamic })

  if (shouldImportDynamic) {
    api.modifyRouteComponent((memo, args) => {
      const { importPath, webpackChunkName } = args
      if (!webpackChunkName) {
        return memo
      }

      let loadingOpts = ''
      if (opts.dynamicImport.loadingComponent) {
        loadingOpts = `LoadingComponent: require('${winPath(
          join(paths.absSrcPath, opts.dynamicImport.loadingComponent)
        )}').default,`
      }

      let extendStr = ''
      if (opts.dynamicImport.webpackChunkName) {
        extendStr = `/* webpackChunkName: ^${webpackChunkName}^ */`
      }
      let ret = `
  __IS_BROWSER
    ? _dvaDynamic({
      <%= MODELS %>
      component: () => import(${extendStr}'${importPath}'),
      ${loadingOpts}
    })
    : require('${importPath}').default
      `.trim()
      const models = getPageModels(join(paths.absTmpDirPath, importPath), api)
      if (models && models.length) {
        ret = ret.replace(
          '<%= MODELS %>',
          `
app: require('@tmp/dva').getApp(),
models: () => [
  ${models
    .map(
      model =>
        `import(${
          opts.dynamicImport.webpackChunkName
            ? `/* webpackChunkName: '${chunkName(paths.cwd, model)}' */`
            : ''
        }'${model}').then(m => { return { namespace: '${basename(
          model,
          extname(model)
        )}',...m.default}})`
    )
    .join(',\r\n  ')}
],
      `.trim()
        )
      }
      return ret.replace('<%= MODELS %>', '')
    })
  }

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
      'redux-rain':
        /* require.resolve(rainDir), */ '/Users/apple/Documents/lab/rainjs/dist/redux-rain.cjs.js',
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
  api.addRuntimePluginKey('redux-rain')

  api.addEntryCodeAhead(
    `
const app = require('@tmp/rain')._onCreate();
${api.config.disableGlobalVariables ? '' : `window.g_app = app;`}
${api.config.ssr ? `app.router(() => <div />);\napp.run();` : ''}
  `.trim()
  )
}
