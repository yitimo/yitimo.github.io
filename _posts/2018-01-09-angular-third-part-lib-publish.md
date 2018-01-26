---
layout: post
title:  angular第三方包开发整理
date:   2018-01-09 14:17:00 +0800
author: yitimo
categories: jekyll update
tags: ["angular"]
keywords:
- angular,
- npm package publish,
- angular lib
description: 从空白开始搭建基于angular的第三方包
---

近日笔者维护自己的几个无名小repo时，发觉想要创作一个第三方``angular``包，着实有一些不难但易乱的小问题，故作此文总结。本文将完成以下内容：
* 从空白开始搭建一个基于``angular``的第三方包
* 在本地测试待发布的包
* 在``npm``或``yarn``发布包中指定内容
* 在普通``angular``应用中引入并使用发布的包

## 基本项目搭建
一般的``angular app``使用``angular-cli``创建，直接``ng new name``搞定，生成的项目把``webpack``、``AOT``、``dev server``等细节都隐藏了，还支持各种参数来配置测试和``sass``等，使用起来直接``npm run start``、``npm run build``，可以说是非常傻瓜了，跳过了学习``webpack``等的许多大坑。
不过，如果是要搭建``angular``第三方包，预编译样式和打包部署这些一般就用不着了，取而代之的要熟悉``npm(yarn)``、``tsconfig``。
### 初始化
项目搭建命令如下：
```
mkdir my-ng-lib
cd my-ng-lib
yarn init
```
一路回车(实际情况中还是要编辑好包的基本信息)最终得到一个``package.json``，然后``vscode``打开：
![初始化npm包](/assets/images/201801/01.png)

### 依赖
作为``angular``的第三方包，首先需要安装如下依赖：
![依赖安装](/assets/images/201801/02.png)

其中``typescript``指定了版本是为了和当前``angular-cli``使用的版本保持一致，实际可能不必要这么做。
现在安装了开发时要用到的包，但这些包并不用在发布以后，实际上发布的时候我们想要的只是发布自己写的代码，而不是依赖的代码，这需要在``package.json``中配置``peerDependencies``作为前置依赖，但包本身不会实际安装这些依赖，实际的包应该由应用项目来安装。现在把``peerDependencies``添加进``package.json``：
```
"peerDependencies": {
    "@angular/common": ">=5.0.0",
    "@angular/core": ">=5.0.0",
    "rxjs": ">=5.0.0"
  }
```
## 项目编写
基本项目搭建好后，我们应该只有``package.json``、``node_modules``和一个lock文件在项目中，现在要加上真正的项目代码了。
无论这个包是用来实现什么目的的，作为一个第三方包，都应该要导出自己的功能以让其他项目引入使用，所以在项目根目录首先要有一个``index.js``文件，而我们要开发的是基于``angular``的``TypeScript``包，使用的自然是``index.ts``了，内容就是各种``export``导出类型、接口、方法等。作为示例这里只导出一个常量：
```
export const myNgLib: string = 'Hello, thie is my angular 3rd part lib';
```
为了支持``TypeScript``我们还需要一个``tsconfig.json``：
```
{
  "compilerOptions": {
    "baseUrl": ".", // 基于哪个目录编译ts
    "declaration": true, // 是否生成声明文件即*.d.ts文件，有了它才有TS的代码提示
    "experimentalDecorators": true, // 用于支持TS装饰器如angular中的 @NgModule({}) 之类
    "emitDecoratorMetadata": true, // 用于支持TS装饰器如angular中的 @NgModule({}) 之类
    "module": "commonjs", // 模块化形式
    "moduleResolution": "node", // 模块化形式
    "rootDir": ".", // 以哪个目录为根
    "lib": ["es2015", "dom"], // 支持编译的内置库
    "skipDefaultLibCheck": true, // 是否跳过内置库检查
    "skipLibCheck": true, // 跳过库检查
    "target": "es5", // 编译目标版本
    "suppressImplicitAnyIndexErrors": true, // 几个检查代码的规则
    "strictNullChecks": true, // 几个检查代码的规则
    "noImplicitAny": true, // 几个检查代码的规则
    "sourceMap": true, // 是否生成 .js.map
    "removeComments": true, // 移除注释
    "noFallthroughCasesInSwitch": true // 几个检查代码的规则
  },
  "exclude": [  // 编译时排除以下内容
    "node_modules",
    "*.d.ts",
    "**/*.d.ts"
  ]
}
```

其中的规则各有各效果，有些为了确定编译路径，有些为了语法检查，有些为了输出声明，还有排除规则等，现在可以``tsc``看看效果了，不过要先把``tsc``添加到``package.json``的``scripts``中：
```
"scripts": {
    "tsc": "tsc"
  }
```
![编译得到.js、js.map、.d.ts](/assets/images/201801/03.png)

## 发布
完美，这么厉害的包，接下来赶紧发布它。发布命令是
```
yarn publish
```
不过在此之前，要准备几件事：
### npm账号
发布之前自然得先有npm账号，添加了就可以，最后用``npm whoami``确认身份。
### 包的基本信息
也就是要完善``package.json``，让全网知道这么厉害的包是我们开发的，包括开源许可、包名、作者、版本号等，最重要直接影响发布的是版本号。
### 选择性发布
基于``angular``的第三方包区别与普通的js包最大的地方就在于，不能直接把整个包都发布到npm，这样会导致奇怪错误，原因在于.ts文件，实际上需要发布的只是.js、.js.map、.d.ts这三种类型的文件就够了。
因为在其他项目中不一定会使用``TypeScript``，即使用了也不会刻意包含node_modules目录，也就是说其他项目只管使用，编译的活由我们得包自己来做，相反要是我们还发布多余的.ts文件，只会导致错误。
为了做到选择性发布，需要一个``.npmignore``文件，和``.gitignore``配合用来忽略上传的文件，一般这些编译输出我们会添加在``.gitignore``中，若项目不存在``.npmignore``，发布到npm时也会使用``.gitignore``，这不是我们想要的，所以需要再创建这个``.npmignore``来忽略.ts文件而包含编译输出：
```
node_modules
yarn-error.log
tsconfig.json
.gitignore
.npmignore
yarn.lock
*.ts
!*.d.ts
```

现在我们的项目看起来是这样的：
![待发布项目](/assets/images/201801/04.png)

使用``yarn pack``命令得到本地打包看看效果如何：
![本地打包](/assets/images/201801/05.png)

看起来非常完美，该有的都有了，不该有的都忽略了，那就可以发布了，不过这里就不发布这个没什么用处的包了 : )
打包至此完成，现在看看用起来怎么样。

## 本地测试
angular的第三方包要做本地测试的话，与普通的包比有一点不足，就是用不了``npm link``，这会导致错误，特别是在第三方包使用到依赖注入的情况下，原因是运行时实际是在两个angular环境下，再进一步说是因为第三方包依赖的是自己的``node_modules``，解决办法也很粗暴，删掉第三方包的``node_modules``即可，不过这代价显然有点大。找遍GitHub发现的另一个办法是配合``--preserve-symlinks``参数，不过可能是笔者使用姿势不对一直没效果。
最后笔者自己的曲线救国办法是手动写``package.json``的``scripts``，本地测试步骤是：
1. 执行 ``yarn pack``得到本地打包
2. 解压到测试项目的node_modules中假装是安装的项目
3. 测试项目中像使用普通安装包一样使用这个直接复制进来的包
参考脚本如下：
```
"scripts": {
    "prepublish": "npm run clean && tsc", // 清理并编译
    "clean": "rimraf index.js index.js.map index.d.ts src/**/*.js src/**/*.js.map src/**/*.d.ts linktest.tgz", // 清理编译文件
    "link": "npm run pack && tar -zxf linktest.tgz && rimraf ../lib-test-app/node_modules/my-ng-lib && mv package ../lib-test-app/node_modules/my-ng-lib", // 打包后解压并移动到测试项目node_modules中
    "pack": "npm run prepublish && yarn pack --filename linktest.tgz" // 执行编译并打包
  }
```

## 总结
* 发布基于``angular``的第三方包的两个难点：一是如何处理好``TypeScript``的编译，二是如何处理好``angular``运行上下文。
* 本文的命令均使用``yarn``完成，``npm``版本命令大同小异均有其对应命令，且发布的包都是在npm托管。
* 另外本文仅涉及发布最基本的基于angular的第三方包，包的实际功能方面没有做深入。其实对于不同功能的第三方包，仍有需要学习的内容。

参考资料：
* [How to create an Angular component library, and how to consume it using SystemJs or Webpack](https://blog.angular-university.io/how-to-create-an-angular-2-library-and-how-to-consume-it-jspm-vs-webpack/)
* [stories linked library](https://github.com/angular/angular-cli/wiki/stories-linked-library)
* [npm link doesn't work with 1.5.4 version](https://github.com/angular/angular-cli/issues/8677)
