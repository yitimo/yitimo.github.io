---
layout: post
title:  不使用cli搭建angular项目
date:   2018-10-10 15:53:31 +0800
author: yitimo
categories: jekyll update
tags: ["angular", "webpack", "typescript"]
keywords:
- angular,
- webpack,
- typescript,
description: 不使用cli搭建angular项目
---

本文将从一个空目录开始搭建一个最小化可运行的完整angular项目。并且不依赖``@angular/cli``，纯手工配置``webpack``来实现。即花费巨大力气完成``@angular/cli``中的如下命令：

```
ng new myApp
ng build --prod
```

## 初始化

初始化项目使用``yarn init``(或``npm init``)完成，最终得到包含单个``package.json``的项目。像这样：

```
mkdir myApp && cd myApp
yarn init
// 一路回车或细心输入配置
```

得到类似如下内容的``package.json``文件：

```
{
  "name": "my-app",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT"
}
```

为了防止第一步太过简单，顺便我们再往里面添加一波依赖：

```
yarn add @angular/core @angular/common @angular/platform-browser @angular/platform-browser-dynamic @angular/compiler rxjs zone.js core-js

yarn add --dev @angular/compiler-cli webpack webpack-cli webpack-dev-server typescript@2.9.2

yarn add --dev html-webpack-plugin
to-string-loader css-loader sass-loader raw-loader file-loader @ngtools/webpack @angular-devkit/build-optimizer uglifyjs-webpack-plugin mini-css-extract-plugin node-sass rimraf http-server
```

* 第一波依赖是angular相关的几个依赖，已经足够最简单运行了
* 第二波是大哥webpack还有干爹typescript。其中typescript必须指定2版本外(目前最新已经到3以上了)。
* 第三波是webpack家族的一些loader和plugin，以及``rimraf``用于删除生成的文件，``http-server``用于运行小服务器来访问生成的资源。

再添加一些脚本来帮助运行打包，这一步最终得到一个只包含单个``package.json``文件的项目，内容像这样：

```
{
    "name": "my-app",
    "version": "1.0.0",
    "main": "index.js",
    "license": "MIT",
    "scripts": {
        "http": "http-server ./wwwroot",
        "prod": "rimraf wwwroot && yarn webpack -- --config ./webpack.config.js --open --progress --profile --content-base src/",
        "dev": "yarn webpack-dev-server -- --config ./webpack.config.dev.js --open --progress --profile --watch --content-base src/",
        "webpack": "node --max_old_space_size=4096 node_modules/webpack/bin/webpack.js",
        "webpack-dev-server": "node --max_old_space_size=4096 node_modules/webpack-dev-server/bin/webpack-dev-server.js"
    },
    "dependencies": {
        "@angular/common": "^6.1.9",
        "@angular/compiler": "^6.1.9",
        "@angular/core": "^6.1.9",
        "@angular/platform-browser": "^6.1.9",
        "@angular/platform-browser-dynamic": "^6.1.9",
        "rxjs": "^6.3.3",
        "zone.js": "^0.8.26"
    },
    "devDependencies": {
        "@angular/compiler-cli": "^6.1.9",
        "typescript": "2.9.2",
        "webpack": "^4.20.2",
        "webpack-dev-server": "^3.1.9"
    }
}
```

## 最简单源代码

抛开脚手架，项目真正的源代码要放到一个``src``目录下，本文重点不在此，所以除了入口文件外只创建最简单的源代码，只有一个根模块，根组件，以及外联的模板和样式文件，像这样：

![目录结构](/assets/images/201810/1.png)

**polyfills.ts：**

```
import 'core-js/es7/reflect';
import 'zone.js/dist/zone';
```

**main.ts：**

```
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';

// webpack DefinePlugin 注入的变量，需要声明，否则编辑器会报错
declare var ENV: string;

if (ENV === 'production') {
    enableProdMode();
}
platformBrowserDynamic().bootstrapModule(AppModule);
```

**index.html：**

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>My App</title>
</head>
<body>
    <my-app>Loading...</my-app>
    <% if (isDevServer) { %><script src="/webpack-dev-server.js"></script><% } %>
</body>
</html>

```

**app.module.ts：**

```
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

@NgModule({
    imports: [
        BrowserModule
    ],
    declarations: [AppComponent],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule { }
```

**app.component.ts：**

```
import { Component } from '@angular/core';

@Component({
    selector: 'my-app',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.css', 'app.component.scss']
})
export class AppComponent { }
```

**app.component.html：**

```
<h2>Hello !!!</h2>
```

**app.component.css：**

```
h2 {
    color: #CD5C5C;
}
```

**app.component.scss：**

```
h2 {
    font-size: 32px;
}
```

其中报错是因为未配置``tsconfig.json``，编辑器报了``es7``装饰器新特性的警告，所以在项目根目录新建一个``tsconfig.json``：

```
{
    "compilerOptions": {
        "target": "es5",
        "module": "esnext", // 重要 可以明显减小最终打包的体积
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "allowSyntheticDefaultImports": true,
        "sourceMap": true,
        "noEmitHelpers": true,
        "importHelpers": true,
        "strictNullChecks": false,
        "lib": ["dom", "es2015"],
        "baseUrl": "./src",
        "paths": {
            "@angular/*": ["../node_modules/@angular/*"]
        }
    },
    "exclude": [
        "node_modules",
        "wwwroot"
    ]
}
```

## webpack

``webpack``配置是重头戏，实际上``@angular/cli``生成的项目内部也使用了``webpack``，不过已经被封装好了使用时完全不用去关心。

基本的``webpack``配置为一个名为``webpack.config.js``的文件，文件导出一个``object``，这个``object``至少包含以下几部分：

1. **entry** 指定入口文件，我们这里是``main.ts``和``polyfills.ts``这两个
2. **output** 指定输出的目录、名字等
3. **module.rules** 配置各种``loader``
4. **plugins** 配置各种额外规则
5. **optimization** 配置资源压缩以及分包
6. **devServer** 配置开发服务器

针对``angular``项目特有的配置项是两个``loader``和一个``plugin``，均来自于``@ngtools/webpack``这个包，实际上``@angular/cli``内部也使用了这个东西，依靠这个包才让手动配置``angular``项目的``webpack``变得简单(对比angular2刚发布的年代)。

最终一个完整的webpack配置像这样：

```
const path = require('path');

const DefinePlugin = require('webpack/lib/DefinePlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const AngularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ENV = 'production';

module.exports = {
    mode: ENV,
    devtool: 'source-map',
    entry: {
        polyfills: path.resolve(__dirname, './src/polyfills.ts'),
        main: path.resolve(__dirname, './src/main.ts')
    },
    output: {
        path: path.resolve(__dirname, 'wwwroot'),
        filename: '[name].[chunkhash].bundle.js',
        sourceMapFilename: '[file].map',
        chunkFilename: '[name].[chunkhash].chunk.js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['to-string-loader', 'css-loader'],
                exclude: [path.resolve(__dirname, './src/styles')]
            },
            {
                test: /\.scss$/,
                use: ['to-string-loader', 'css-loader', 'sass-loader'],
                exclude: [path.resolve(__dirname, './src/styles')]
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
                include: [path.resolve(__dirname, './src/styles')]
            },
            {
                test: /\.scss$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
                include: [path.resolve(__dirname, './src/styles')]
            },
            {
                test: /\.html$/,
                use: ['raw-loader'],
                exclude: [path.resolve(__dirname, './src/index.html')]
            },
            {
                test: /\.(jpg|png|gif|pdf|eot|woff2?|svg|ttf)$/,
                use: 'file-loader'
            },
            {
                test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
                use: [{
                    loader: '@angular-devkit/build-optimizer/webpack-loader',
                    options: {
                        sourceMap: false
                    }
                }, '@ngtools/webpack']
            },
            {
                test: /\.js$/,
                use: [{
                    loader: '@angular-devkit/build-optimizer/webpack-loader',
                    options: {
                        sourceMap: false
                    }
                }]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            inject: 'body',
            xhtml: true,
            minify: true
        }),
        new DefinePlugin({
            'isDevServer': 'false',
            'ENV': JSON.stringify(ENV)
        }),
        new AngularCompilerPlugin({
            tsConfigPath: './tsconfig.json',
            entryModule: './src/app/app.module#AppModule'
        }),
        new MiniCssExtractPlugin({ filename: '[name]-[hash].css', chunkFilename: '[name]-[chunkhash].css' })
    ],
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: false,
                parallel: true,
                cache: path.resolve(__dirname, 'webpack-cache/uglify-cache'),
                uglifyOptions: {
                    compress: {
                        pure_getters: true,
                        passes: 2
                    },
                    output: {
                        ascii_only: true,
                        comments: false
                    }
                }
            })
        ],
        splitChunks: {
            chunks: 'all'
        }
    },
    devServer: {
        port: 4201,
        host: '127.0.0.1',
        historyApiFallback: true,
        watchOptions: {
          ignored: /node_modules/
        }
    },
    node: {
        global: true,
        crypto: 'empty',
        process: false,
        module: false,
        clearImmediate: false,
        setImmediate: false,
        fs: 'empty'
    }
}
```

现在执行命令``yarn prod``，以上配置将生成生产模式加AOT模式下的输出，并且最终代码都会压缩至最小体积，像这样：

![输出](/assets/images/201810/2.png)

执行``yarn http``运行一下看看：

![运行](/assets/images/201810/3.png)

至此纯手工最简单的angular项目就完成了。对这个小项目做几个总结：

1. 其中的配置只针对``prod + AOT``模式，即不是``JIT``模式
2. 对于开发环境可以再新增一个``webpack.config.dev.js``来配置生产环境下的webpack规则，并搭配``webpack-dev-server``使用。对于生产环境就像文中这样先``yarn prod``，然后扔到服务器上。
3. ``@ngtools/webpack``与``MiniCssExtractPlugin``不兼容，所以注意配置``exclude``规则。
4. ``tsconfig.json``中的``"module": "esnext"``这一配置相比``"module": "commonjs"``能减少不少体积。
