import { join, dirname, basename, extname } from 'path'
import { readFileSync } from 'fs'
import globby from 'globby'
import isRoot from 'path-is-root'
import { chunkName, findJS, optsToArray, endWithSlash } from '@lambda/utils'

function isReactComponent(componentStr) {
  return /^\(.*?\)\s*?=>/.test(componentStr)
}

function isRelativePath(path) {
  return /^\.{1,2}\//.test(path)
}

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
        source: 'redux-rain/dynamic',
        specifier: '_rainDynamic'
      }
    : null

  if (addRouterImportValue) {
    api.addRouterImport(addRouterImportValue)
  }
  // api.modifyRouterRootComponent(modifyRouterRootComponentValue)
}

function dynamicImport(api, options) {
  const { paths, winPath } = api

  if (options.level) {
    process.env.CODE_SPLITTING_LEVEL = options.level
  }

  api.modifyAFWebpackOpts((memo, opts = {}) => {
    return {
      ...memo,
      disableDynamicImport: !!opts.ssr
    }
  })

  api.modifyRouteComponent((memo, args) => {
    const { importPath, webpackChunkName } = args

    let loadingOpts = ''
    if (options.loadingComponent) {
      if (isReactComponent(options.loadingComponent.trim())) {
        loadingOpts = `, loading: ${options.loadingComponent.trim()}`
      } else if (isRelativePath(options.loadingComponent.trim())) {
        loadingOpts = `, loading: require('${winPath(
          join(paths.absSrcPath, options.loadingComponent)
        )}').default`
      } else {
        loadingOpts = `, loading: require('${options.loadingComponent.trim()}').default`
      }
    }

    let extendStr = ''
    if (options.webpackChunkName) {
      extendStr = `/* webpackChunkName: ^${webpackChunkName}^ */`
    }
    return `__IS_BROWSER ? dynamic({ loader: () => import(${extendStr}'${importPath}')${loadingOpts} }) : require('${importPath}').default`
  })
}

export default function(api, opts = {}) {
  const { paths, cwd, compatDirname, winPath } = api
  const shouldImportDynamic = opts.dynamicImport

  dynamicImport(api, opts)

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
    if (opts.level) {
      process.env.CODE_SPLITTING_LEVEL = opts.level
    }

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
    ? _rainDynamic({
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

  const pathToRegexpDir = compatDirname(
    'path-to-regexp/package.json',
    cwd,
    dirname(require.resolve('path-to-regexp/package.json'))
  )

  const objectAssignDir = compatDirname(
    'object-assign/package.json',
    cwd,
    dirname(require.resolve('object-assign/package.json'))
  )

  api.modifyAFWebpackOpts(memo => {
    const alias = {
      ...memo.alias,
      'redux-rain': rainDir,
      'path-to-regexp': pathToRegexpDir,
      'object-assign': objectAssignDir,
      ...(opts.immer
        ? {
            immer: compatDirname(
              'immer/package.json',
              cwd,
              dirname(require.resolve('immer/package.json'))
            )
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

  api.registerGenerator('rain:model', {
    Generator: require('./model').default(api),
    resolved: join(__dirname, './model')
  })

  api.addRuntimePlugin(join(__dirname, './runtime'))
  api.addRuntimePluginKey('redux-rain')

  api.addEntryCodeAhead(
    `
const app = require('@tmp/rain')._onCreate();
${api.config.disableGlobalVariables ? '' : `window.g_app = app;`}
  `.trim()
  )
}
