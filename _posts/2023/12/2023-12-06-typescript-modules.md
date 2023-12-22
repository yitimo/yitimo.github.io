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

排除以上可能后, 迷茫之际看到了错误里的 ``VNodeNormalizedChildren``, 这是 vue3 里的类型, 可知直接原因一定是 react 和 vue 的类型定义冲突了. 果然在 vue 里全局声明了 JSX:

![vue jsx 定义](/assets/images/202312/vue_jsx_type.jpg)

而 @types/react 里也声明了 JSX:

![react jsx 定义](/assets/images/202312/react_jsx_type.png)

然后后引入的 JSX 声明就会覆盖前一个同名类型, ``JSX.Element`` 的类型就开始混乱了.

期望的是react组件正常使用``.tsx``文件来开发, 而vue使用``.vue``文件来开发, 那么如何做到呢?

最佳解是将 tsconfig 里的 jsx 配置值为 react-jsx, 这是 react17 开始支持的方式, 配置后甚至不需要手动在 tsx 文件里多写一行 ``import React from 'react``.

> 是否可以配置忽略 vue 里的 JSX 声明, 或者如 vue 自己的注释里说的, 3.4 版本开始自己就移除了

## 为什么

### 类型从哪来

TypeScript默认会包含工程内所有模块, 和 ``node_modules/@types`` 目录下的所有模块。当在 ts 文件里引入 react 时, react 库本身未提供类型, 所以 ts 会关联 ``node_modules/@types/react`` 下的类型, 如果未安装, 会有提示:

![missing react type](/assets/images/202312/missing_react_type.png)

与此不同, vue3 自带了类型声明, 所以引入 vue 使用时直接就能有类型提示。

### TypeScript 全局类型

ts里可以用``declare namespace``语法来声明全局变量, 比如这样:

``` ts
declare namespace React {
  ...
}
```

然后就可以全局使用这个变量了:

![全局使用react变量](/assets/images/202312/global_use_react_ts_error.jpg)

出现了熟悉的错误, 必须手动引入: ``import React from 'react';``, 为什么需要手动引入?

可以到 ``node_modules/@types/react`` 的类型定义里找到这样的导出:

``` ts
declare namespace React {
  ...
}
export = React;
export as namespace React;
```

即生命了 React 命名空间, 然后将其导出, 最终定义出了一个 UMD 模块而不是ES模块(并不是 ``export default React``)。

然后 ts 就需要我们手动像引入ES模块一样将其引入来兼容. 对应在 js 里就需要 ``import * as React from 'react'`` 这样来转 ES 模块然后使用. 到了 tsx 里也一样, ts 会使用全局声明好的 React 和 JSX 类型, 并将 react 组件转义为 ``React.createElement``.

而当配置了 tsconfig 的 jsx 为 react-jsx 时, 就不再需要手动引入 React 了, 这是 react17 开始提供的新方式, 会将 react 的组件创建方式转义为一个 jsx 模块方法, 最终编译产物会像这样:

``` js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
function Child() {
    return (0, jsx_runtime_1.jsx)("div", { children: "Child" });
}
function App() {
    return (0, jsx_runtime_1.jsx)(Child, {});
}
exports.App = App;
```

这就使得 react 组件使用的 JSX 类型是来自专门的 JSX 命名空间, 而不再是和 vue 冲突的 global.JSX 了, 也就是 ``node_modules/@types/react/jsx-runtime.d.ts`` 下的 JSX 声明:

``` ts
export namespace JSX {
    type ElementType = React.JSX.ElementType;
    interface Element extends React.JSX.Element {}
    interface ElementClass extends React.JSX.ElementClass {}
    interface ElementAttributesProperty extends React.JSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>;
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends React.JSX.IntrinsicClassAttributes<T> {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
}
```

这是一个常规的 ES 模块导出, 自然也不需要手动 import 一次 React 了。

## 扩展阅读

- [TypeScript JSX](https://www.typescriptlang.org/docs/handbook/jsx.html)
- [TypeScript Modules - Theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html)
