---
layout: post
title: TypeScript 模块化和 JSX
date: 2023-12-04 14:20:12 +0800
author: yitimo
categories: frontend
tags: ["frontend"]
keywords:
- frontend
description: TypeScript module and jsx.
---

## 问题

近日尝试配置脚手架来构建多页面, 并支持页面之间使用不同的框架, 比如页面A使用vue而页面B使用react.

在进行vue3的ts配置时遇到了错误:

![vue类型错误](/assets/images/202312/vue_type_error.jpg)

于是调整了tsconfig配置:

![调整tsconfig](/assets/images/202312/tsconfig_change.jpg)

然后就轮到react这边报错了:

![tsx类型错误](/assets/images/202312/tsx_type_error.jpg)

根据这个错误各种搜索无果, 能想到的几个可能:

- vscode抽风: 重启换电脑无效
- 实际安装了多个版本的``@types/react``类型有冲突: 反复检查确实只安装了最新版本
- 安装的``@types/react``版本本身有问题: 尝试更换多个版本无效
- react 不支持 tsconfig 的 ``"moduleResolution": "NodeNext"`` 配置: 另起一个干净的纯react项目发现其实也支持

排除以上可能后, 迷茫之际看到了错误里的 ``VNodeNormalizedChildren``, 这是 vue3 里的类型, 直接原因一定是 react 和 vue 的类型定义冲突了. 果然在 vue 里全局声明了 JSX:

![vue jsx 定义](/assets/images/202312/vue_jsx_type.jpg)

期望的是react组件正常使用``.tsx``文件来开发, 而vue使用``.vue``文件来开发, 那么如何做到呢?

## 几个tsconfig配置

## 扩展阅读
