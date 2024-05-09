---
layout:       post
title:        taro多端编译 - 引入多端文件
date:         2024-05-08 17:54:12 +0800
author:       yitimo
categories:   frontend
tags:         ["frontend"]
keywords:     ["taro", "多端引入"]
description:  taro支持引入多端文件
---

> 官方文档: [统一接口的多端文件](https://taro-docs.jd.com/docs/envs#%E7%BB%9F%E4%B8%80%E6%8E%A5%E5%8F%A3%E7%9A%84%E5%A4%9A%E7%AB%AF%E6%96%87%E4%BB%B6)

本文将解析 taro 是如何做到一行代码自动引入不同端文件的, 效果就是当使用 ``import xxx from './util'`` 引入 util 模块时, taro 会优先尝试引入编译平台对应的实现(``import xxx from './util.[weapp|alipay|...].[js|ts|jsx|tsx]'``).

## webpack 和 enhanced-resolve

作为前置知识先讲讲 webpack 中的 resolve 配置, 官方文档[在这里](https://webpack.js.org/concepts/module-resolution/), [和这里](https://webpack.js.org/api/resolvers/).

resolver 是个通过绝对路径来定位模块的工具库, 一个模块可以这样依赖于另一个模块:

``` js
import foo from 'path/to/module';
// or
require('path/to/module');
```

依赖模块可以是应用里的代码, 也可以是个第三方库. resolver 帮助 webpack 找到通过 ``require/import`` 语句引入的所有需要被包含进 bundle 里的模块代码. webpack 使用 [enhanced-resolve](https://github.com/webpack/enhanced-resolve) 来在打包模块时处理文件路径.

> enhanced-resolve 能处理这三种文件路径: 绝对路径(``/a/b/c``)、相对路径(``./a/b/c``)、模块路径(``a/b/c``)

而 webpack 配置里的 resolve 配置, 就是给 enhanced-resolve 用的了, 常用的配置比如:

- modules: 指定从哪里找``模块路径``, 比如一般会配置为 ``node_modules``
- alias: 配置路径别名
- extensions: 配置模块文件后缀名, 比如一般会配置为 ``['.js', '.jsx', '.ts', '.tsx']``

webpack 构建时会生成自己的 compiler 实例, 里面有一些内置的 resolver 实例, 并提供了定制的方式:

- **normal resolver**: 处理绝对路径或相对路径的模块, 可以通过 resolve.plugins 定制
- context resolver: 处理指定 context 下的模块, 可以通过 resolve.plugins 定制
- loader resolver: 处理 webpack loader 模块, 可以通过 resolveLoader 定制

[enhanced-resolve提供了一些内置的插件hook](https://github.com/webpack/enhanced-resolve/blob/main/lib/ResolverFactory.js#L318), 而 taro 则定制了一个 enhanced-resolve 插件来定位多端模块的路径, 就是 ``@tarojs/runner-utils`` 下的 ``MultiPlatformPlugin``.

## MultiPlatformPlugin

插件分为这几部分:

- 基本的 enhanced-resolve 插件结构, 入口 hook 和完成后要触发的 hook
- 确定需要多端解析的路径
- 执行多端路径替换

源码[在这里](https://github.com/NervJS/taro/blob/main/packages/taro-runner-utils/src/resolve/MultiPlatformPlugin.ts).

### 基本插件结构

``` ts
export class MultiPlatformPlugin {
  private source: string
  private target: string

  constructor (source: string, target: string) {
    this.source = source // 从 described-resolve 这个 hook 进入
    this.target = target // 解析完成后触发 resolve 这个 hook
  }

  public apply (resolver) {
    const target = resolver.ensureHook(this.target)
    resolver
      .getHook(this.source)
      .tapAsync('MultiPlatformPlugin', (request, resolveContext, callback) => {
        // request: 请求目标, 包含路径等
        // resolveContext: 当前 resolve 上下文
        // callback: 解析完成后主动执行回调
        // ...
      })
  }
}
```

### 确定需要多端解析的路径

request入参里的路径可能有三种(相对路径、绝对路径、模块路径), 这里 taro 排除了模块路径并手动将相对路径转为了绝对路径, 然后处于性能考虑跳过了 ``node_modules`` 下的路径:

``` ts
const innerRequest: string = request.request || request.path
if (!innerRequest || !request.context.issuer) return callback()

if (!path.extname(innerRequest)) {
  let srcRequest: string
  if (path.isAbsolute(innerRequest)) {
    // absolute path
    srcRequest = innerRequest
  } else if (!path.isAbsolute(innerRequest) && /^\./.test(innerRequest)) {
    // relative path
    srcRequest = path.resolve(request.path, request.request)
  } else {
    return callback()
  }
  if (/node_modules/.test(srcRequest) && !this.includes(srcRequest)) {
    return callback()
  }
  // ...
}
```

### 执行多端路径替换

替换函数在 ``@tarojs/helper`` 的 ``resolveMainFilePath`` 里, 手动遍历文件名和后缀, 检查是否有多端文件并尝试替换:

``` ts
export function resolveMainFilePath (p: string, extArrs = SCRIPT_EXT): string {
  const realPath = p
  const taroEnv = process.env.TARO_ENV
  for (let i = 0; i < extArrs.length; i++) {
    const item = extArrs[i]
    if (taroEnv) {
      if (fs.existsSync(`${p}.${taroEnv}${item}`)) {
        return `${p}.${taroEnv}${item}`
      }
      if (fs.existsSync(`${p}${path.sep}index.${taroEnv}${item}`)) {
        return `${p}${path.sep}index.${taroEnv}${item}`
      }
      if (fs.existsSync(`${p.replace(/\/index$/, `.${taroEnv}/index`)}${item}`)) {
        return `${p.replace(/\/index$/, `.${taroEnv}/index`)}${item}`
      }
    }
    if (fs.existsSync(`${p}${item}`)) {
      return `${p}${item}`
    }
    if (fs.existsSync(`${p}${path.sep}index${item}`)) {
      return `${p}${path.sep}index${item}`
    }
  }
  return realPath
}
```

## 样式文件怎么办

从源码能看到如果request的路径是有后缀的, 也不会进行多端处理, 所以如果项目里的样式是包含后缀引入的, 则样式文件就不支持多段引入. 有两个办法支持(以``scss``文件为例):

1. 垫一层 ts/js 文件的多端实现, 在里面引入样式文件(``echo "import './index.scss'" >> ./index.weapp.ts``)
2. 将样式文件后缀配置到 resolve.extensions 列表里, 然后省略后缀引入样式文件, 如果用了 ts 还需要声明一下 ``*.scss`` 模块类型, 如果配置了 eslint 则也需要配置一下 resolve

## 实现一个vite版本的

vite 里构建是基于 rollup, 所以可以实现一个 vite 插件来定制 rollup 的 resolveId 这个 hook 来实现多端引入, 还可以借用 taro helper 库提供的 ``resolveMainFilePath`` 来实现:

``` js
async resolveId(importee, importer, options) {
  // 忽略 node_modules
  if (/node_modules/.test(importer)) return null
  // 忽略模块路径
  if (!path.isAbsolute(importee) && !/^\./.test(importee)) return null
  // 解析完整路径 也可以手动解析
  const { id: targetId } = await this.resolve(importee, importer, options)
  const extDotIndex = targetId.lastIndexOf('.')
  let srcPath = targetId
  let srcExt = ''
  if (extDotIndex > -1) {
    srcPath = targetId.substring(0, extDotIndex)
    srcExt = targetId.substring(extDotIndex)
  }
  // 替换多端实现
  const realPath = helper.resolveMainFilePath(srcPath, srcExt ? [srcExt] : config.resolve.extensions)
  if (realPath !== targetId) {
    return this.resolve(realPath, importer, options)
  }
  return null
},
```

## 总结

taro 框架的构建部分整体上是对 webpack 的较复杂配置, 包括本文提到的通过 webpack 的 resolve.plugins 配置来实现多端文件引入.
