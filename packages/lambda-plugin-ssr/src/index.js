export default function(api, opts) {
  // 开启ssr时不设置webpack的optimization.splitChunks
  api.modifyAFWebpackOpts((memo, opts = {}) => {
    return {
      ...memo,
      disableDynamicImport: !!opts.ssr
    }
  })

  // ssr时调用app.run | 只初始化不挂载dom
  api.addEntryCodeAhead(`app.router(() => <div />);\napp.run();`)
}

/**
 * 将涵盖ssr的代码抽离到这里
 * 配置ssr wepback的支持
 */
