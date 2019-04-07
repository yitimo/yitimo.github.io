---
layout: post
title:  动态切换antd主题色配置
date:   2019-04-07 13:22:13 +0800
author: yitimo
categories: react
tags: ["react", "antd", "dynamic theme"]
keywords:
- react,
- antd,
- dynamic theme,
description: 通过antd-theme-webpack-plugin配置antd动态主题
---

[Ant Design](https://ant.design/docs/react/customize-theme-cn)官网介绍了其主题色能力，并且相对模糊的提到了通过less来动态切换主题色的方案(底部[社区教程](https://medium.com/@mzohaib.qc/ant-design-dynamic-runtime-theme-1f9a1a030ba0)中)。而[ant.design](https://ant.design)本身看起来也是用同一方案实现了动态主题色切换。本文将介绍并配置此动态主题方案，即侧重``antd-theme-webpack-plugin``这个插件配合``antd``+``react``的使用，以后再另行介绍``less``的``modifyVars``原理。

## 项目准备

首先准备两个less文件用于定义全局的主题样式，比如笔者放在了``src/styles``下：

![Add global less](/assets/images/201904/0701.png)

在``_var.less``中引入antd默认样式：

``` less
@import '~antd/lib/style/themes/default.less';
```

除此之外项目中的其他自定义变量都可以在这里定义。

在``global.less``中引入``_var.less``，这里面定义所有的全局样式，比如先来一个class：

``` less
@import './_var.less';
/**
 * 此处定义整个应用所有组件的主题样式
 * 组件自己的less(即其他所有less)均无法使用定制主题色，而是使用默认主题色
 */

.primary {
    background: @primary-color;
}
```

然后记得在应用中引入``global.less``，比如``index.js``中：

``` javascript
import React from 'react';
import ReactDOM from 'react-dom';
import './styles/global.less';
import App from './App';
ReactDOM.render(<App />, document.getElementById('root'));
```

## webpack配置

在webpack配置中需要新增一个plugin即一开始安装的``antd-theme-webpack-plugin``。在``HtmlWebpackPlugin``之后添加这个插件：

``` javascript
new AntDesignThemePlugin({
    indexFileName: 'index.html',
    antDir: path.resolve(__dirname, '../node_modules/antd'),
    stylesDir: path.resolve(__dirname, '../src/styles'),
    varFile: path.resolve(__dirname, '../src/styles/_var.less'),
    mainLessFile: path.resolve(__dirname, '../src/styles/global.less'),
    themeVariables: [
        '@primary-color'
    ],
}),
```

根据不同项目需要各自指定正确的路径配置，其中``antDir``、``stylesDir``、``varFile``、``mainLessFile``各自对应``antd``依赖位置、上面定义的``styles``目录位置、变量less位置、全局less位置。

``themeVariables``用于指定需要替换颜色的变量名，根据自己需求配置。

### indexFileName

配置中的``indexFileName``字段为``index.html``，实际上当项目的``index.html``位置变化时，都必须指定正确的路径，此配置的作用是由插件来自动注入全局less到``index.html``，如果找不到或者为指定这个字段，则需要手动往项目的``index.html``中添加这样的配置：

``` html
<link rel="stylesheet/less" type="text/css" href="color.less" />
<script>window.less = { async: false, env: 'production', javascriptEnabled: true };</script>
<script type="text/javascript" src="assets/less.min.js"></script>
```

这三行代码做的事情是：

1. 引入一个``color.less``，此文件由之后less生成。
2. 配置全局less，如果是3.x版本需要配置``javascriptEnabled: true``，``antd-theme-webpack-plugin``自动生成的话目前使用的是2.7.2版本的CDN。
3. 全局引入less，与项目中自行配置的less不同，此less专门用于指定的这两个less和antd内部样式，而项目中的less则用于具体组件样式(所以只有antd内部和指定的``_var.less``和``global.less``支持动态更改主题色)。

换句话说，你只要检查最终生成的``index.html``有没有自动注入这三行less配置(或者手动配置)就能判断是否配置成功。

## 总结

关于使用，做法是在需要初始化或切换主题色的地方通过``window.less.modifyVars({antd主题色名: 自定义颜色值})``来设置主题色。

至此最简单的支持动态切换主题的antd项目已经配置好了，以下是笔者发现的几个坑点：

* ``indexFileName``一定要路径正确才能成功自动注入全局less，可以跟项目中``HtmlWebpackPlugin``的``filename``保持一致即可。
* 项目中所有需要主题色的样式，都要集中到``_var.less``跟``global.less``中，否则访问到的主题色是antd默认的，而不是自定义好的。
* 配置会自动生成``color.less``文件，但路径不一定就在``index.html``同级(根据项目配置)导致无法访问到，此时需要在插件配置中添加``publicPath``配置，值与``webpack``的``output.publicPath``保持一致即可。
* ChromeExtension不允许html中内联js脚本，此时不能再使用``indexFileName``自动注入less，而必须另外想办法来手动配置全局less。
* 手动配置的less，需要注意2/3版本less的区别以及自己管理好publicPath(需要正确访问到color.less)。
