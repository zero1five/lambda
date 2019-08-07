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

  api.modifyEntryRender((memo, args) => {
    memo = memo.replace(
      '{{ modifyEntryRender }}',
      `
    if (window.g_useSSR) {
      // 如果开启服务端渲染则客户端组件初始化 props 使用服务端注入的数据
      props = window.g_initialData;
    }
    `.trim()
    )

    return memo
  })
}

/**
 * 将涵盖ssr的代码抽离到这里
 * 配置ssr wepback的支持
 */
