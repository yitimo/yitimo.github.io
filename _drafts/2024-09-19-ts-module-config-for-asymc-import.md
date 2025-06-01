---
layout: post
title: typescript异步import模块配置
date: 2024-09-19 10:42:12 +0800
author: yitimo
categories: frontend
tags: ["frontend"]
keywords:
- frontend
description: .
---

早期的 JavaScript 语言还只运行在浏览器里, 没有模块概念, 但仍然可以为一个 web 页面拆分成多个 js 文件, 然后用多个 ``<script />`` 标签引入:

``` html
<html>
  <head>
    <script src="a.js"></script>
    <script src="b.js"></script>
  </head>
  <body></body>
</html>
```

这种方式有一些缺陷, 尤其是当 web 页面变得庞大且复杂时. 缺陷之一尤其是, 所有加载到同一个页面 js 脚本共享同一个作用域——可以称为“全局作用域”——这意味着所有脚本都要注意不要覆盖了其他脚本里的变量或函数.

解决此问题的任何系统都是给 js 文件带来它们自己的作用域, 并提供部分代码在文件间共享的方式, 这被称为“模块系统”.(听起来是在表明模块系统里的每个文件都是一个“模块”, 实际上常被用来比作 script 文件, 运行在模块系统之外的全局作用域之下.)

> 目前已有很多种模块系统, TypeScript 支持输出其中的一部分, 本文将主要聚焦于其中两种最主要的: ``ECMAScript Module(ESM)`` 和 ``CommonJS(CJS)``.

*TODO: ...*

## 模块输出格式

在任何项目中, 对于模块我们要回答的首要问题就是宿主期望的是哪种模块类型, 然后 TS 才能设置匹配每个文件的输出格式. 有时候宿主只支持一种模块类型——比如浏览器里是 ESM, node11 及以下是 CJS. node12及以上版本同时支持 ESM 和 CJS 模块, 但需要使用文件后缀和 ``package.json`` 文件来决定每个文件的模块格式, 如果文件内容不匹配期望的格式就会抛出错误.

``tsconfig.json/compilerOptions.module`` 配置将这一信息提供给编译器. 其主要目的是控制编译输出的所有 js 文件的模块格式, 同时也用来告知编译器应该如何检测所有文件的模块.
