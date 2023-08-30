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

``` text
up to date in 744ms
```

内部其实是 **建立了当前npm包目录到npm全局的symlink**, 也就是 ``ln -s`` 命令做的事情.

那么npm全局目录在哪呢, 可以运行命令 ``ls -l $(npm root -g)``, 如果刚才``npm link``成功了, 应该能看到link的包被列出, 以及你此前全局安装过的其他npm包也在这里.

比如使用了``nvm``的情况下像这样:

![global_npm_pkgs](/assets/images/202206/global_npm_pkgs.png)

> ``npm ls -g``也能看到link到全局的包

如果link的包名是基于某个命名空间的, 比如 ``@hello/world``, 那列出的就是目录 ``@hello``, 再进去就是 ``world`` 目录咯.

如果``link``到全局的包还包含了``bin``配置, 像这样:

![pkg with bin](/assets/images/202206/pkg_with_bin.png)

则也能被``link``到全局``bin``下:

![pkg bin in global](/assets/images/202206/pkg_bin_in_global.png)

## npm link pkg-utils 做了什么

在本地另一工程下(以``pkg-host``为例)执行 ``npm link pkg-utils``, 会看到类似 ``changed [n] packages in [m]s`` 的输出, 就好像在``host``工程内安装了``pkg-utils``这个``npm``包一样.

但本地``link``默认不会改变``package.json``文件内容, 即如果``package.json``里之前有该包且版本号为``^1.0.0``, link本地包时**并不会**被修改为 ``file://../path/to/pkg-utils``.

> TODO: 本地``link``默认不会修改``package.json``, 那会修改``package-lock.json``吗?

最终效果也就是``pkg-utils``包所在的本地目录被软链到了``pkg-host``工程的 ``node_modules``中, 然后可以像使用常规``npm i``安装的包一样来使用:

![pkg utils in pkg host](/assets/images/202206/pkg_utils_in_pkg_host.png)

## 使用 npm link 进行 "真包调试"

``npm link``比较适合的用途之一就是帮助开发npm包项目, 可以不实际发布包版本就做到"真包调试", 但也有一些区别和要注意的点:

**会link整个目录:** 常规安装npm包时, 实际上安装到node_modules内的是``npm pack``的产物, 会应用``.npmignore``规则只安装真正被发布的子文件或目录, 而``npm link``终究只是个``symlink``, 实际上会link整个目录, 包括所有子文件和目录.

**妥善取消link**: 当认为开发完成, 并想要取消link时, 可以这么做:

- 在``pkg-host``里重新运行``npm i``或``npm i pkg-utils``, 也就是重新装一次这个npm包, 这样做会把link的包挤掉, 安装回``package.json``内声明好的版本
- *(不推荐)* 在``pkg-host``里``npm unlink pkg-utils``, 实测这同时会移除 package.json 里的包依赖(如果此前安装了)

以上两步只是从``pkg-host``工程里移除了link过来的``pkg-utils``, 实际上``pkg-utils``还被link在全局呢, 想要移除全局的link, 可以使用``npm uninstall/rm -g``命令, 就像正常移除一个全局安装的包一样:

![rm pkg_utils from global](/assets/images/202206/rm_pkg_utils_from_global.png)

**使用ts开发的工程, link后使用的应该(should)是编译后的js模块, 而不是原始的ts模块**, 按照一般的tsconfig配置, 会忽略node_modules内的ts模块, 而使用编译后的commonjs模块, 这就需要npm包工程在link后, 继续改动ts模块时, 还要记得重新进行tsc编译, 生成最新的js模块供宿主工程使用.

或者也可以专门配置宿主工程的tsconfig, 来包含node_modules中这个npm包的ts模块, **但更建议的方式是写一个脚本监听相关文件改动, 然后自动编译ts到js**.

## 还要注意哪些?

- **npm link 支持多个包**: 在包1和包2各自``npm link``后, 在包3里 ``npm link 包1 包2`` 即可同时 link 两个包
- **工程化项目如何判断某个包是link状态**: ``fs.lstatSync('包所在的node_modules下的目录').isSymbolicLink()``
- **link 某个包后 publish**: 这样做是可以的, 但需要把link的包列在``bundleDependencies``里, 如果此前没安装这个包, 还需要执行``npm install <dep> --package-lock-only``, 然后在pkg-host里运行``npm publish``会将目前link的``pkg-utils``内容一起打包进``npm pack``产物里. 但个人**不建议**这么做, link应该只用在本地调试
- ...

## 都有哪些配置参数?

TODO: ...

## 拓展阅读

**什么是synlink?** 一图流解释:

![symlink](/assets/images/202206/symlink.jpg)

[**什么是bundleDependencies?**](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#bundledependencies)
