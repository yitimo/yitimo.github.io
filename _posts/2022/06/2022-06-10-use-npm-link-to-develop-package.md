---
layout: post
title: 使用npm-link命令帮助开发npm包
date: 2022-06-10 11:33:12 +0800
author: yitimo
categories: frontend
tags: ["frontend"]
keywords:
- frontend,
description: Use npm link to develop package
---

npm link 命令核心原理即**使用 symlink 能力建立本地npm包目录的软链接**, 本文将基于[官网v8.x文档](https://docs.npmjs.com/cli/v8/commands/npm-link)归纳其一些特性和用法.

> 本文内容基于 node@v16.x, npm@v8.x

## npm link 做了什么

在本地npm包仓库下运行命令 ``npm link`` 后, 应该会看到这样的输出:

``` text
added 1 package in 495ms
```

或者这样的:

``` test
up to date in 744ms
```

内部其实是做了这件事: **建立当前npm包目录到npm全局的symlink**. 也就是 ``ln -s`` 命令做的事情, 也可以不妥帖类比成windows下的``快捷方式``

那么npm全局目录在哪呢, 可以运行命令 ``ls -l $(npm root -g)``, 如果刚才``npm link``成功了, 应该能看到link的包被列出, 以及你此前全局安装过的其他npm包也在这里.

如果link的包名是基于某个命名空间的, 比如 ``@hello/world``, 那列出的就是目录 ``@hello``, 再进去就是 ``world`` 目录咯.

## npm link @hello/world 做了什么

在本地另一(使用npm包管理的)工程下(假设为app)执行 ``npm link @hello/world``, 会看到类似 ``changed [n] packages in [m]s`` 的输出, 就好像在app工程内安装了 @hello/world 这个npm包一样

实际上也就是 @hello/world 包所在的本地目录被软链到了app工程的 node_modules 中, 然后可以像使用常规 npm i 安装的包一样来使用.

## 使用 npm link 进行 "真包调试"

比较适合的用途之一就是帮助开发npm包项目, 可以不实际发布包版本就做到"真包调试", 但也有一些区别和要注意的点:

**会link整个目录**: 常规安装npm包时, 实际上安装到node_modules内的是npm pack的产物, 会应用 npmignore 规则只安装真正被发布的子文件或目录, 而 npm link 终究只是个 symlink, 实际上会link整个目录, 包括所有子文件和目录

**link 命令默认不会影响 package.json和package-lock.json**, 当认为开发完成想要取消link时, 有两种方式:

1. npm unlink npm包名, 实测这同时会移除 package.json 里的包依赖(如果此前安装了)
2. npm i -S npm包名, 也就是重新装一次这个npm包, 这会把link的包挤掉, 前提是此npm包此前已经发过版本了能安装上

---

TODO: 待完成
