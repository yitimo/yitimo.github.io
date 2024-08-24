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

## lazyCodeLoading 绑架

## 问题表现

## 排查过程

新建一个微信原生的 demo 工程, 默认就是开启次配置的, 表现也一切正常, 不会出现白屏:

![新建空项目默认开启配置](/assets/images/202408/新建空项目默认开启配置.jpg)

那问题会不会出在 taro 框架呢? 如果是的话有没有办法避免呢?

接下来深入一个taro工程的微信端产物, 看看taro最终构建出了一个啥样的微信原生工程:

![taro工程的微信小程序端构建产物](/assets/images/202408/taro工程的微信小程序端构建产物.jpg)

定位到出现白屏的页面, 其wxml部分非常简单:

![白屏页面wxml](/assets/images/202408/白屏页面wxml.jpg)

可见taro是基于小程序的template能力来在运行时渲染出整个页面所有组件的, 那是不是 template 能力导致的白屏呢? 在 demo 项目里试试:

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

好像还是不够还原taro产物, 那就是自定义组件! 出现白屏的页面有用到混合原生自定义组件的写法, 再补充到 demo 工程里试试:

接下来新建一个全局自定义组件 hello:

![全局hello组件](/assets/images/202408/全局hello组件.jpg)

然后在全局模板里作为 tmpl_hello 的实现, 最后在分包页面里注册组件并使用新版的 tmpl_hello 进行渲染:

![基于template使用全局组件](/assets/images/202408/基于template使用全局组件.jpg)

然后工具就报错了:

![分包基于template使用主包组件报错](/assets/images/202408/分包基于template使用主包组件报错.jpg)

这下问题初步定位了: 微信小程序在分包内基于template能力使用主包中的自定义组件时, 在开发者工具内会报错, 即使已经在分包页面里注册过这个全局组件.

表现也与社区反馈的完全一致: 关闭 lazyCodeLoading 时一切正常! 真机运行一切正常!

但是与实际taro工程的情况还是不太一样, taro工程里没有报错, 只是白屏, 这应该与运行时渲染组件代码的执行时机有关, 把 template 里的全局组件改为基于 root 数据动态渲染试试:



## demo 复现问题

## 遗留问题
