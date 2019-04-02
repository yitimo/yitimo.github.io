---
layout: post
title:  从零搭建 webpack+react+typescript 启动项目
date:   2019-04-01 09:45:13 +0800
author: yitimo
categories: react
tags: ["react"]
keywords:
- react,
- typescript,
- webpack,
description: Create webpack+react+typescript app without c-r-a.
---

本文将不使用脚手架(``create-react-app``)，从空项目开始搭建一个基本的react启动项目，并配置``typescript``。涉及到的技术有：

* yarn/npm
* webpack
* typescript
* react
* less

首先初始化一个空项目，像这样：

![Create Empty Dir](/assets/images/201904/0101.png)

具体的项目信息可以自定义，本文只关心应用部分。

## 安装依赖

需要安装的依赖分这么几类：react库相关、webpack loader相关、webpack plugin相关。

名称 | 作用
 -|-
 react <br /> react-dom <br /> react-router-dom <br /> ... | react 库相关依赖，按需添加
 typescript | 
 awesome-typescript-loader | 处理``.tsx``文件
 css-loader <br /> less-loader | 处理样式
 url-loader | 配合 ``MiniCssExtractPlugin`` 处理样式中内联的字体、图标等资源
 CopyWebpackPlugin | 帮助直接复制指定资源到打包输出(比如图片等静态资源)
 HtmlWebpackPlugin | 帮助渲染入口``html``文件，将打包结果自动引入
 MiniCssExtractPlugin | 帮助压缩和单独打包``样式``
 webpack.DefinePlugin | webpack内置，帮助注入全局变量到应用代码中
 TerserWebpackPlugin | 帮助压缩打包结果和摇树优化

可以之后用到哪些装哪些，也可以一口气全部先装好：

``` shell
yarn add react react-dom
yarn add -D typescript @types/react @types/react-dom webpack webpack-cli webpack-dev-server awesome-typescript-loader less less-loader url-loader terser-webpack-plugin mini-css-extract-plugin html-webpack-plugin 
```

不要忘了加个``.gitignore``排除掉``node_modules``这些不需要托管的文件。

然后我们需要这么几个文件：

* tsconfig.json
* webpack.config.json
* index.html // 入口html
* index.ts // 应用入口
* global.less // 全局样式
* App // react应用代码
* * App.tsx
* * App.less

## 基本webpack配置

下一步准备基本的webpack配置，先不包含任何loader或plugin：

 配置名 |  | 作用
 - | - | -
 mode |  | webpack模式，比如开发或生产
 devtool |  | 配置source-map，开发模式用inline-source-map
 entry |  | 指定入口规则
 output |  | 指定输出规则
 - | filename | 打包结果命名规则
 - | path | 打包输出目录
 resolve |  | 配置处理规则
 - | extensions | 处理指定后缀名的文件
 - | modules | 处理指定模块，比如node_modules和应用所在目录
 - | alias | 依赖的别名，方便相对路径引用
 optimization |  | 优化配置
 - | splitChunks | 将输出拆分打包
 - | minimizer | 输出的压缩配置
 devServer |  | 开发服务器

## tsconfig.json配置

tsconfig用于配置ts的编译规则，大致需要这么些配置：

 配置名 | 作用
 - | -
 compileOnSave | 用于提供IDE支持，在保存时触发编译
 compilerOptions.module | 指定生成代码的模块化类型
 compilerOptions.target | 指定生成的es版本
 compilerOptions.moduleResolution | 分为ts默认方式和node方式，指如何来查找引入的依赖(import xxx from 'xxx')
 compilerOptions.typeRoots | 指定类型声明文件(.d.ts)的路径(如果包不自带就到这里找) <br /> 配置正确了这些依赖才会有代码提示
 compilerOptions.strictNullChecks | 是否严格检查空值
 compilerOptions.baseUrl | 基于哪个目录编译
 compilerOptions.paths | 可以配置全局路径别名以免去太多``../..``的相对路径
 compilerOptions.jsx | 为react准备的配置，提供更多react特性支持
 include | 只编译指定目录下的ts

## loader配置

较简单的loader需要以下三个：

``` javascript
{
    test: /\.(ts|tsx)$/,
    loader: "awesome-typescript-loader",
    options: {
        configFileName: "modoc/tsconfig.json" // 如果需要指定tsconfig位置则在此配置
    }
},
{
    test: /\.(css|less)$/,
    use: [
        MiniCssExtractPlugin.loader, // 配合css单独分包
        {
            loader: "css-loader"
        }, {
            loader: "less-loader",
            options: {
                javascriptEnabled: true
            }
        }]
},
{
    test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/,
    use: "url-loader" // 加载css中的资源文件
}
```

除此之外，笔者因为项目中引入了``monaco-editor``，需要给它单独配置``babel-loader``：

``` javascript
{
    test: /\.js$/,
    use: {
        loader: 'babel-loader',
        options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-syntax-dynamic-import']
        }
    },
    include: [path.resolve(__dirname, "../node_modules/monaco-editor")] // 只处理monaco-editor
}
```

## Plugins配置

plugins配置可以让webpack的打包规则更灵活，比较简单的配置只需要下面这几个plugin：

``` javascript
new CopyWebpackPlugin([
    { from: "modoc/assets", to: "assets" } // 打包时复制资源文件
]),
new HtmlWebpackPlugin({ // 入口html配置
    filename: "index.html",
    template: "modoc/index.html",
    inject: "body",
    chunks: "all",
    minify: true,
    xhtml: true,
    hash: true
}),
new MiniCssExtractPlugin({ // css单独分包配置
    filename: '[name].[hash].css',
    chunkFilename: '[name].[hash].chunk.css',
})
```

完整的配置[看这里](https://github.com/yitimo/momo/blob/master/modoc/webpack.config.common.js)。配置的核心包括：入口(entry)、输出(output)、loader、plugin、压缩(optimization)。

*草稿待完善*
