import { join } from 'path'
import { existsSync, statSync } from 'fs'

function test(path) {
  return existsSync(path) && statSync(path).isDirectory()
}

export default function(opts) {
  const { cwd, config } = opts
  const outputPath = config.outputPath || './dist'

  let pagesPath = 'src/pages'

  if (test(join(cwd, 'src/page'))) {
    pagesPath = 'src/page'
  }
  if (test(join(cwd, 'src/pages'))) {
    pagesPath = 'src/pages'
  }
  if (test(join(cwd, 'pages'))) {
    pagesPath = 'pages'
  }

  const absPagesPath = join(cwd, pagesPath)
  const absSrcPath = join(absPagesPath, '../')

  const envAffix = process.env.NODE_ENV === 'development' ? '' : `-production`
  const tmpDirPath = `${pagesPath}/.rain${envAffix}`

  const absTmpDirPath = join(cwd, tmpDirPath)

  return {
    cwd,
    outputPath,
    absOutputPath: join(cwd, outputPath),
    absNodeModulesPath: join(cwd, 'node_modules'),
    pagesPath,
    absPagesPath,
    absSrcPath,
    tmpDirPath,
    absTmpDirPath,
    absRouterJSPath: join(absTmpDirPath, 'router.js'),
    absLibraryJSPath: join(absTmpDirPath, 'entry.js'),
    absRegisterSWJSPath: join(absTmpDirPath, 'registerServiceWorker.js'),
    absPageDocumentPath: join(absPagesPath, 'document.ejs')
  }
}
