---
layout: post
title:        深入 taro 运行时 - @tarojs/taro 模块的实现
date:  2025-06-01 18:39:12 +0800
author:       yitimo
categories:   frontend
tags:         ["frontend"]
keywords:     ["taro"]
description:  深入 taro 运行时 - @tarojs/taro 模块的实现
---

taro工程下有很多子包, 以下是 AI 给的各个子包简单说明, 供参考:

- **babel-plugin-*、babel-preset-taro**: Babel 插件和预设，用于 Taro 项目的代码转译，支持不同框架（如 React、Solid、Taro API 等）的 JSX/TS/JS 转换。
- **create-app**: 脚手架工具，用于初始化新的 Taro 项目。
- **css-to-react-native**: 将 CSS 转换为 React Native 可用的样式对象。
- **eslint-config-taro、stylelint-config-taro-rn、stylelint-taro、stylelint-taro-rn**: 代码风格和规范相关的配置，分别用于 JS/TS、React Native、样式等。
- **jest-helper**: 测试辅助工具，简化 Taro 项目的单元测试配置。
- **postcss-***: 一系列 PostCSS 插件，用于样式转换，如 px 单位转换、常量解析、HTML 样式处理等。
- **rollup-plugin-copy**: Rollup 插件，用于构建时复制文件。
- **shared**: Taro 内部通用工具库，包含类型判断、错误断言等基础工具。
- **taro**: Taro 核心 API，对外暴露的主包，包含小程序/H5/React Native 等端的入口和核心能力。详见 taro/README.md。
- **taro-api**: Taro 的 API 类型定义和接口声明。
- **taro-cli**: 命令行工具，支持项目创建、编译、转换、预览、上传等操作。
- **taro-cli-convertor**: 小程序项目一键迁移/转换工具。
- **taro-components、taro-components-advanced**: Taro 组件库，封装了跨端 UI 组件。
- **taro-helper**: 编译、依赖、终端等辅助工具集合。
- **taro-plugin-mini-ci**: 小程序云开发/CI 插件，支持命令行上传、预览、打开开发者工具等。
- **taro-platform-***: 各端适配包（如 weapp、alipay、tt、jd、swan、harmony 等），实现不同小程序/平台的编译和运行时适配。
- **taro-webpack5-prebundle**: Webpack5 预打包相关能力，提升构建性能。
- **taro-webpack5-runner**: Webpack5 编译器 Runner，Taro 的主编译实现，包含小程序分包、公共依赖抽取等复杂逻辑。
- ...

今天先重点来看看比较常用到的 ``@tarojs/taro`` 包的实现细节, 与之相关的有 taro、taro-api、taro-runtime、shared 等目录, 对应 ``@tarojs/taro``、``@tarojs/taro-api``、``@tarojs/taro-runtime``、``@tarojs/shared``这几个 npm 包.

整个 ``@tarojs/taro`` 包的实际 js 代码就以下几行：
``` ts
const { hooks } = require('@tarojs/runtime')
const taro = require('@tarojs/api').default

if (hooks.isExist('initNativeApi')) {
  hooks.call('initNativeApi', taro)
}

module.exports = taro
module.exports.default = module.exports
```

主要涉及了三块内容:
- 引入 ``@tarojs/api`` 包的 taro 对象
- 触发 ``initNativeApi`` 这个 taro 内部钩子
- 最后直接导出 taro 对象

另外包里还有完整的 types 类型定义和 h5 下的 css 样式文件.

## types类型定义

所有类型都定义在入口模块下, 通过 ``/// <reference path="...">`` 和 ``/// <reference types="...">``，引入来拆分子目录文件方便维护，包括：
- 全局类型（global.d.ts）
- API 类型（taro.api.d.ts）：Taro 提供的所有跨端 API 类型
- 组件类型（taro.component.d.ts）：Taro 组件相关类型
- 配置类型（taro.config.d.ts）：小程序 App、页面等配置项类型
- 生命周期类型（taro.lifecycle.d.ts）：App、页面、组件等生命周期类型
- 运行时类型（taro.runtime.d.ts）
- 各端平台的 shim 类型（如支付宝、京东、百度、字节、微信等小程序平台的扩展类型）
- H5、RN 端的 overlay 类型

其中 ``TaroStatic`` 会被挂载到 default 导出的对象上, 即最终 ``import Taro from '@tarojs/taro'`` 导入的大对象的类型

还有 index.d.ts 里定义了三个全局类型:

- defineAppConfig：定义小程序 App 配置
- definePageConfig：定义页面配置
- importNativeComponent：导入原生组件

小细节像 ``getCurrentPages/getApp`` 这些小程序下的全局函数, taro 是没有声明到 global 的, 而是也声明到了 ``TaroStatic`` 里, 实际上 taro 代码里也是这样来调用的: ``Taro.getCurrentPages()``

## Taro对象

来到 packages/taro-api 目录下, ``@tarojs/api`` 包默认导出了这些字段:
``` ts
const Taro: Record<string, unknown> = {
  Current, // 从 @tarojs/runtime 引入的 Current 对象, 包含 app, page, router 等运行时状态数据
  getCurrentInstance, // 从 @tarojs/runtime 引入, 返回 Current 对象
  eventCenter, // 从 @tarojs/runtime 引入的事件系统实例, 运行时触发 getEventCenter hook 并 new 出来
  Events, // 从 @tarojs/runtime 引入, 事件class, eventCenter 也是 new 了此实例
  nextTick, // 从 @tarojs/runtime 引入, 内部二次实现的 wx.nextTick
  options, // 从 @tarojs/runtime 引入, 用来定制运行时行为, 比如是否开启 prerender, 是否开启 debug 等

  ENV_TYPE, // 是个枚举常量, 对应 process.env.TARO_ENV 里的各平台值
  getEnv, // 根据 process.env.TARO_ENV 返回 ENV_TYPE 枚举值

  Behavior, // 模拟小程序的 Behavior 机制, 默认实现直接返回了传入的 options
  Link, // request 拦截器类, Taro.request 就包装了一层 new Link 的拦截器容器实例
  interceptors, // timeoutInterceptor 和 logInterceptor 两个内置 request 拦截器
  interceptorify, // 返回一个 Link 拦截器实例的快捷方法, 内部没有实际使用
  // 返回一个函数, 能将 designWidth/deviceRatio 等尺寸转换相关配置设置到 taro.config 里
  // taro 编译时会注入到 entry 代码里执行
  getInitPxTransform,
}

// 挂载 设计稿初始化函数, 支持手动调用
Taro.initPxTransform = getInitPxTransform(Taro)
// 挂载 px 转换函数, 用来在 jsx style 里转成 rpx/rem
Taro.pxTransform = getPxTransform(Taro)
// 挂载 preload 函数, 功能就是将字段设置到 Current.preloadData 里, 可以用于页面跳转传参
Taro.preload = getPreload(Current)

export default Taro
```

看到这里会发现导出的对象和实际使用时的 api 实现并不一致, 而且缺少了很多平台 api, 我们往下看具体做了什么.

### 通用 api 挂载实现

接下来举例看看部分通用 api, **首先是 ``pxTransform`` 的实现**:
``` ts
export function getPxTransform (taro) {
  return function (size) {
    // 从全局配置里取设计尺寸
    const config = taro.config || {}
    const baseFontSize = config.baseFontSize
    const deviceRatio = config.deviceRatio || defaultDesignRatio
    const designWidth = ((input = 0) => isFunction(config.designWidth)
      ? config.designWidth(input)
      : config.designWidth || defaultDesignWidth)(size)
    if (!(designWidth in deviceRatio)) {
      throw new Error(`deviceRatio 配置中不存在 ${designWidth} 的设置！`)
    }
    const targetUnit = config.targetUnit || defaultTargetUnit
    const unitPrecision = config.unitPrecision || defaultUnitPrecision
    // 向下取整
    const formatSize = ~~size
    // 基于当前设计尺寸的目标单位比例, 比如默认 750 尺寸下比例为 1
    let rootValue = 1 / deviceRatio[designWidth]
    switch (targetUnit) {
      case 'rem':
        // 转 rem 基于基础字号的 2 倍
        rootValue *= baseFontSize * 2
        break
      case 'px':
        // 转 px 基于自身的 2 倍
        rootValue *= 2
        break
    }
    // 原始尺寸转目标单位尺寸: 1px -> 2px/0.025rem
    let val = formatSize / rootValue
    if (unitPrecision >= 0 && unitPrecision <= 100) {
      // 保护小数点 默认是 5 位
      val = Number(val.toFixed(unitPrecision))
    }
    return val + targetUnit
  }
}
```

函数最终会获取配置好的设计尺寸计算出和 css 里一致的 rpx 数值, 并加上目标单位(仍然是 px)返回, 至于 px 单位转 rpx 单位是另外由 postcss-pxtransform 插件完成的.

**然后看看似曾相识的 Taro.nextTick api.** 我们知道 vue 里有 ``this.nextTick`` 方法在数据触发 dom 更新后回调, 小程序里也有 ``wx.nextTick`` 等待本轮同步 setData 完成后的微任务队列里回调, 而 react 里直接没有这个 api, 看看 taro 是怎么实现的:
``` ts
import { Current } from './current'
import { TaroRootElement } from './dom/root'
import env from './env'

import type { TFunc } from './interface'

const TIMEOUT = 100

export const nextTick = (cb: TFunc, ctx?: Record<string, any>) => {
  const beginTime = Date.now()
  const router = Current.router

  const timerFunc = () => {
    setTimeout(function () {
      ctx ? cb.call(ctx) : cb()
    }, 1)
  }

  if (router === null) return timerFunc()

  const path = router.$taroPath

  /**
   * 三种情况
   *   1. 调用 nextTick 时，pendingUpdate 已经从 true 变为 false（即已更新完成），那么需要光等 100ms
   *   2. 调用 nextTick 时，pendingUpdate 为 true，那么刚好可以搭上便车
   *   3. 调用 nextTick 时，pendingUpdate 还是 false，框架仍未启动更新逻辑，这时最多轮询 100ms，等待 pendingUpdate 变为 true。
   */
  function next () {
    const pageElement: TaroRootElement | null = env.document.getElementById<TaroRootElement>(path)
    if (pageElement?.pendingUpdate) {
      if (process.env.TARO_PLATFORM === 'web') {
        // eslint-disable-next-line dot-notation
        pageElement.firstChild?.['componentOnReady']?.().then(() => {
          timerFunc()
        }) ?? timerFunc()
      } else {
        pageElement.enqueueUpdateCallback(cb, ctx)
      }
    } else if (Date.now() - beginTime > TIMEOUT) {
      timerFunc()
    } else {
      setTimeout(() => next(), 20)
    }
  }

  next()
}
```

taro 框架下更新状态是从根节点下发的, 并且内部优化了 setData 的调用, 也就是上面代码里的 pageElement, 而 Taro.nextTick 主要就是在等待下一轮更新开始然后回调, 而且是按 20ms 的分片来轮询, 最多到 100ms.

> Taro.nextTick(): setState(react) -> render(react) -> setData(taro) -> setData(wx) -> 触发回调

### 平台 api 挂载

以上介绍了 taro 下全平台通用 api 的挂载和实现, 那么 taro 又是如何挂载某个具体平台下的常规 api 的呢? 答案在 initNativeApi 这个 hook 里.

以微信平台为例, 先找到 ``packages/taro-platform-weapp/src/runtime.ts`` 这个模块:
``` ts
import { mergeInternalComponents, mergeReconciler } from '@tarojs/shared'
import { components, hostConfig } from './runtime-utils'

mergeReconciler(hostConfig)
// ...
```

这个模块最终会在项目构建时注入到头部代码里, 然后在应用启动时前置执行, 具体的 taro 构建流程后续会另开一篇介绍 :)

其中 mergeReconciler 函数会调用入参 hostConfig 里的 hook 函数:
``` ts
export function mergeReconciler (hostConfig, hooksForTest?) {
  // hooks 是 packages/shared/src/runtime-hooks.ts 里创建的 taro 内部 hook 列表, 其中就有 initNativeApi
  const obj = hooksForTest || hooks
  const keys = Object.keys(hostConfig)
  keys.forEach(key => {
    obj.tap(key, hostConfig[key])
  })
}
```

然后 hostConfig 里透传了 initNativeApi 函数:
``` ts
// ...
import { initNativeApi } from './apis'
// ...
export const hostConfig = {
  initNativeApi,
  // ...
}
```

看看 initNativeApi 函数的实现:
``` ts
import { processApis } from '@tarojs/shared'

import { needPromiseApis } from './apis-list'

declare const wx: any

export function initNativeApi (taro) {
  processApis(taro, wx, {
    // ...
  })
  taro.cloud = wx.cloud
  taro.getTabBar = function (pageCtx) {
    if (typeof pageCtx?.getTabBar === 'function') {
      return pageCtx.getTabBar()?.$taroInstances
    }
  }
  taro.getRenderer = function () {
    return taro.getCurrentInstance()?.page?.renderer ?? 'webview'
  }
}
```

果然是在挂载 api 到 taro 对象上, 最后看看 processApis 函数的实现:
``` ts
function processApis (taro, global, config: IProcessApisIOptions = {}) {
  // ...
  const patchNeedPromiseApis = config.needPromiseApis || []
  const _needPromiseApis = new Set<string>([...patchNeedPromiseApis, ...needPromiseApis])
  const preserved = [
    // ...不需要处理的一些 api
  ]
  const apis = new Set(
    !config.isOnlyPromisify
      ? Object.keys(global).filter(api => preserved.indexOf(api) === -1)
      : patchNeedPromiseApis
  )
  // ...
  apis.forEach(key => {
    if (_needPromiseApis.has(key)) {
      const originKey = key
      taro[originKey] = (options: Record<string, any> | string = {}, ...args) => {
        // ...
        // Promise 化
        const p: any = new Promise((resolve, reject) => {
          obj.success = res => {
            config.modifyAsyncResult?.(key, res)
            options.success?.(res)
            if (key === 'connectSocket') {
              resolve(
                Promise.resolve().then(() => task ? Object.assign(task, res) : res)
              )
            } else {
              resolve(res)
            }
          }
          obj.fail = res => {
            options.fail?.(res)
            reject(res)
          }
          obj.complete = res => {
            options.complete?.(res)
          }
          if (args.length) {
            task = global[key](obj, ...args)
          } else {
            task = global[key](obj)
          }
        })
        // ...
        return p
      }
    } else {
      // ...
    }
  })
  // ...
}
```

### 常用 api 挂载

taro 挂载完平台 api 后, 还会挂载一些常用 api, 比如 Taro.getCurrentPages 等, 此外一开始看到 taro 大对象里有拦截器相关字段, 这里还会二次包装 request api 来支持拦截器能力:
``` ts
function equipCommonApis (taro, global, apis: Record<string, any> = {}) {
  taro.canIUseWebp = getCanIUseWebp(taro)
  taro.getCurrentPages = getCurrentPages || nonsupport('getCurrentPages')
  taro.getApp = getApp || nonsupport('getApp')
  taro.env = global.env || {}

  try {
    taro.requirePlugin = requirePlugin || nonsupport('requirePlugin')
  } catch (error) {
    taro.requirePlugin = nonsupport('requirePlugin')
  }

  // request & interceptors
  const request = apis.request || getNormalRequest(global)
  function taroInterceptor (chain) {
    return request(chain.requestParams)
  }
  const link = new taro.Link(taroInterceptor)
  taro.request = link.request.bind(link)
  taro.addInterceptor = link.addInterceptor.bind(link)
  taro.cleanInterceptors = link.cleanInterceptors.bind(link)
  taro.miniGlobal = taro.options.miniGlobal = global
  taro.getAppInfo = function () {
    return {
      platform: process.env.TARO_PLATFORM || 'MiniProgram',
      taroVersion: process.env.TARO_VERSION || 'unknown',
      designWidth: taro.config.designWidth
    }
  }
  taro.createSelectorQuery = delayRef(taro, global, 'createSelectorQuery', 'exec')
  taro.createIntersectionObserver = delayRef(taro, global, 'createIntersectionObserver', 'observe')
}
```

## 总结

先来总结一下 ``import Taro from '@tarojs/taro'`` 背后都做了什么:
![taro_api_bound](/assets/images/202506/taro_api_bound.png)

这解释了为何在单测环境下直接使用 ``@tarojs/taro`` 会找不到 api, 甚至会有奇怪报错, 因为其背后依赖了一些 taro 运行时启动代码. 正确方式应该将其 mock 掉, 并且尝试将可测试代码与 taro 解耦.

这样设计也提供了一些参考: 除了到处 if/else 之外, 还可以如何封装多平台兼容的工具库
- 插件化组织平台特殊逻辑, 即**先默认提供兜底实现, 然后在运行时动态注入各平台特殊实现.**
- 实现接口层来抹平 api 的平台、版本等差异, 比如有些平台不存在某个 api, 或者 api 参数不同等情况, 对内使用时保持一致.
- 我们也可以从外部去挂载 api 到 Taro 对象上, 扩展 TaroStatic 类型, 定制全局 taro 能力

参考链接:

- [编写端平台插件](https://docs.taro.zone/docs/platform-plugin/how#%E4%BA%8C%E5%A4%84%E7%90%86-api)
- [wx.nextTick](https://developers.weixin.qq.com/miniprogram/dev/api/ui/custom-component/wx.nextTick.html)
