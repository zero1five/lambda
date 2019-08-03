# lambda-webpack

[English](./README.md) | 简体中文

> 零配置的 webpack bundler

## Install

```bash
$ npm i -D lambda-webpack
```

## Usage

### NPM

```
//package.json
{
  //..
  "start": "lambda-webpack dev"
}
```

```bash
$ npm start
```

### Node

```javascript
const compiler = require('lambda-webpack/lib/dev')

compiler({ cwd, port, base, webpackConfig })

compiler.run()
```

### API

通过 node 使用的配置参数与使用 webpackrc.js 配置文件基本一致。

```
// webpackrc.js
module.exports = {
  cwd: ''
}

// node
compiler({ cwd })
```

#### cwd

Type: `string`

当前 Node.js 进程的工作目录。

### port

Type: `number`

webpackServer 运行的端口号。

### base

Type: `string`

内部功能。

### webpackConfig

Type: `object`

自定义的 webpack 配置。[详细配置](#配置相关)

### proxy

Type: `object`

与 webpackServer.proxy 相同。

### https

Type: `boolean | object`

是否支持 https，与 webpackServer.https 相同。

### contentBase

Type: `string`

静态文件路径，与 webpackServer.contentBase 相同。

### \_beforeServerWithApp

Type: `function[App]`

在 webpackServer 所有中间件应用之前的钩子，与 webpackServer.before 相同。

### beforeMiddlewares

Type: `function[]`

在 webpackServer 内置中间件执行之前的自定义中间件。

### afterMiddlewares

Type: `function[]`

在 webpackServer 内置中间件执行之后的自定义中间件。

### beforeServer

Type: `function[devServer]`

在 webpackServer 运行之前的钩子。

### afterServer

type: `function[devServer, devServerPort]`

在 webpackServer 运行之后的钩子。

### onFail

type: `function[{ stats }]`

编译完成后存在错误时会执行的钩子。

### onCompileDone

type: `function[{ isFirstCompile, stats }]`

编译完成后会执行的钩子。

---

## 配置相关

传递给 webpack 的 config。
