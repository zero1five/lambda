import { join, dirname, basename, extname } from 'path'
import globby from 'globby'
import isRoot from 'path-is-root'
import { chunkName, findJS, endWithSlash } from 'lambda-base-utils'

function isSrcPath(path, api) {
  const { paths, winPath } = api
  return endWithSlash(winPath(path)) === endWithSlash(winPath(paths.absSrcPath))
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

export default function(api) {
  const {
    paths,
    winPath,
    config: { dynamicImport: opts }
  } = api

  if (opts.level) {
    process.env.CODE_SPLITTING_LEVEL = opts.level
  }

  api.modifyAFWebpackOpts((memo, args) => {
    return {
      ...memo,
      disableDynamicImport: !!opts.ssr
    }
  })

  handleDependencyImport(api, { shouldImportDynamic: opts })

  api.modifyRouteComponent((memo, args) => {
    const { importPath, webpackChunkName } = args
    if (!webpackChunkName) {
      return memo
    }

    let loadingOpts = ''
    if (opts.loadingComponent) {
      loadingOpts = `LoadingComponent: require('${winPath(
        join(paths.absSrcPath, opts.loadingComponent)
      )}').default,`
    }

    let extendStr = ''
    if (opts.webpackChunkName) {
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
        opts.webpackChunkName
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
