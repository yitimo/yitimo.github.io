---
layout: post
title: 微信小程序开启lazyCodeLoading后工具白屏问题
date: 2024-08-24 16:55:12 +0800
author: yitimo
categories: frontend
tags: ["frontend"]
keywords:
- frontend
description: .
---

## 问题表现

问题表现简单来说就是: 小程序开启 ``"lazyCodeLoading": "requiredComponents"`` 后导致了页面白屏.

补充几项已知信息:

- 使用真机预览调试, 甚至发布上线都一切正常, 出问题的只有开发者工具
- 使用 taro/uniapp 等跨端框架时更容易遇到
- 跨端框架用到混合使用原生自定义组件时更更容易遇到

一些社区相关问题:

- [https://developers.weixin.qq.com/community/develop/doc/0002c06294c0e85ebb4ed897151400](https://developers.weixin.qq.com/community/develop/doc/0002c06294c0e85ebb4ed897151400)
- [https://developers.weixin.qq.com/community/develop/doc/000a6461590ee8e628dd061fb5bc00](https://developers.weixin.qq.com/community/develop/doc/000a6461590ee8e628dd061fb5bc00)
- [https://developers.weixin.qq.com/community/develop/doc/000e862d7946284ac76e8dfe45b800](https://developers.weixin.qq.com/community/develop/doc/000e862d7946284ac76e8dfe45b800)
- [https://developers.weixin.qq.com/community/develop/doc/0004624f66c96083889f55db454c00](https://developers.weixin.qq.com/community/develop/doc/0004624f66c96083889f55db454c00)
- [https://github.com/NervJS/taro/issues/14539](https://github.com/NervJS/taro/issues/14539)
- [https://github.com/NervJS/taro/issues/13053](https://github.com/NervJS/taro/issues/13053)

社区方案基本上都是等待官方修复, 或干脆关闭 ``"lazyCodeLoading": "requiredComponents"`` 配置.

但小程序有部分能力是必须强制开启该配置的, 比如使用 ``xr-frame`` 3d渲染能力时, 比如使用 ``skyline`` 渲染时.

并且开启配置后理论上可以优化小程序启动时间和运行时内存占用, 可以的话还是希望能开启.

## 排查过程

新建一个微信原生的 demo 工程, 默认就是开启 ``lazyCodeLoading`` 配置的, 表现也一切正常, 不会出现白屏:

![新建空项目默认开启配置](/assets/images/202408/新建空项目默认开启配置.jpg)

那问题会不会出在 taro 框架呢? 如果是的话有没有办法避免呢?

接下来深入一个taro工程的微信端产物, 看看taro最终构建出了一个啥样的微信原生工程:

![taro工程的微信小程序端构建产物](/assets/images/202408/taro工程的微信小程序端构建产物.jpg)

定位到出现白屏的页面, 其wxml部分非常简单:

![白屏页面wxml](/assets/images/202408/白屏页面wxml.jpg)

可见 taro 是基于小程序的 [template](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/template.html) 能力来在运行时渲染出整个页面所有组件的, 那是不是 template 能力导致的白屏呢? 在 demo 项目里试试:

新建全局的template文件, 然后声明一个template:

``` html
<!-- base.wxml -->
<template name="tmpl_hello">
	<view>Hello {{root}}</view>
</template>
```

在分包页面里引入并使用这个 template:

``` html
<!-- pages-subpackage/pkg-a/pages/sub/index.wxml -->
<import src="../../../../base.wxml"/>
<text>pages-subpackage/pkg-a/pages/sub/index.wxml</text>

<template is="tmpl_hello" data="{{root:root}}" />
```

``` js
// pages-subpackage/pkg-a/pages/sub/index.js
Page({
	data: {
		root: 'pkg-a'
	},
})
```

最终的分包结构像这样, 结果也正常渲染出来了:

![新建并配置基于template的渲染分包页面](/assets/images/202408/新建并配置基于template的渲染分包页面.jpg)

好像还是不够还原 taro 产物, 那就是自定义组件! 出现白屏的页面有用到混合原生自定义组件的写法, 再补充到 demo 工程里试试:

接下来新建一个全局自定义组件 hello:

![全局hello组件](/assets/images/202408/全局hello组件.jpg)

然后在全局模板里作为 tmpl_hello 的实现, 最后在分包页面里注册组件并使用新版的 tmpl_hello 进行渲染:

![基于template使用全局组件](/assets/images/202408/基于template使用全局组件.jpg)

然后工具就报错了:

![分包基于template使用主包组件报错](/assets/images/202408/分包基于template使用主包组件报错.jpg)

这下问题初步定位了: 微信小程序在分包内基于template能力使用主包中的自定义组件时, 在开发者工具内会报错, 即使已经在分包页面里注册过这个全局组件.

表现也与社区反馈的完全一致: 关闭 lazyCodeLoading 时一切正常! 真机运行一切正常!

但是与实际taro工程的情况还是不太一样, taro工程里没有报错, 只是白屏, 这应该与运行时渲染组件代码的执行时机有关, 把 template 里的全局组件改为基于 root 数据动态渲染试试:

![动态setData渲染template组件](/assets/images/202408/动态setData渲染template组件.jpg)

这样表现就与taro工程下一致了, template 组件不渲染, 也没有任何报错, 在 taro 工程的情况下, 页面中的组件都基于 taro_tmpl 这个 template 渲染, 最终导致的效果就是: 页面一片空白, 只有一个 page 标签, 也没有任何报错.

## 问题总结

总结一下问题表现: 微信小程序在开启 ``"lazyCodeLoading": "requiredComponents"`` 配置后, 在分包页面中使用主包的 template 渲染主包中的自定义组件时, 真机运行正常, 但开发者工具内会无法渲染, 即使已经在分包页面里注册过该自定义组件.

## 解决方案

既然定位到是分包内不能使用主包组件的问题, 那就可以有两个解决方案:

- 遇到导致白屏的自定义组件时, 不仅要在使用组件的分包页面里注册, 还需要随机找一个主包页面注册
- 也可以干脆在 ``app.json`` 里全局注册自定义组件

也就是要在主包页面或全局的 ``usingComponents`` 里注册一下自定义组件, 但不需要实际使用.

但这其实都违背了懒加载的初衷, **在不需要的位置过度注册了组件**.

### taro 下遗留问题

- **为什么只有自定义组件会出问题**: view、text、image 等小程序基础组件不需要注册, 不存在主包分包问题.
- **只有部分原生自定义组件无法渲染, 仍有部分表现正常**: 原因暂未明确, 估计是正常渲染的组件运行时涉及了其他主包逻辑, 触发了将自己在主包中(全局)加载. 更容易导致问题的似乎是 依赖较少 且 在相对上层使用(更接近page) 的组件.
