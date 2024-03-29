---
layout: post
title: 使用单元测试来帮助前端开发
date: 2020-02-27 22:35:12 +0800
author: yitimo
categories: frontend
tags: ["frontend", "unit test", "jest"]
keywords:
- frontend,
- unit test,
- jest,
description: use unit test to help front end develop.
---

## 单元测试做了什么

从单元测试字面意思可以想到，这是对项目内的某个最小单元(类的方法、工具函数、条件语句)进行的测试。
对于开发人员来说，项目开发过程一般只进行冒烟测试，且只是以代码正确执行为目的。更全面的业务、流程测试要让专门的测试工程师来完成。成功的单元测试还能减轻测试人员的工作，尽量避免让他们来帮我们找空指针、死循环、页面白屏之类的代码错误。

而像jest、mocha等这些测试框架就是通过提供一个强大的测试环境，支持只执行某个被 ``import`` 进来的模块，并能尽可能的模拟所有测试用例执行时不需要关心只需要执行结果的流程和副作用。

最终能做到的就是，单元测试用例里一个模块是如何执行的，正式上线时这个模块代码就是如何执行的，这就能避免很多代码执行错误。同时凭借测试框架附带的其他强大能力，我们还能提前得知自己代码的逻辑复杂度、测试覆盖率等信息。

举个例子，我们有一个 ``getBillAction`` 函数用于获取在界面上展示的账单，做了这么一些事情:

1. 从 state、getters 中取出一些数据，拼装成请求参数
2. 使用拼装好的参数请求后端接口
3. 处理接口返回的结果，提取需要的字段更新到 state

如果我们想要真实复现这个行为来进行测试，假设我们已经开发完成了商品列表页和购物车页面直接从账单页开始测试流程，那我们需要做这么一些事情:

1. 启动项目并保证前置代码执行正确，比如用户登录凭证等一些动态数据
2. 将真实或模拟的数据同步到 state 中
3. 等页面加载完成后开始执行这个拉取账单的action
    1. 从 state、getters 中取出一些数据，拼装成请求参数
    2. 使用拼装好的参数请求后端接口
    3. 处理接口返回的结果，提取需要的字段更新到 state
4. 认为action已经执行完成后
    1. 检查开发者工具中的请求是否成功
    2. 界面上的展示是不是已经基于最新请求到的数据了

这里面有很多步骤是测试 ``拉取账单`` 这个单一行为之外的事情，这些步骤出现任何问题，都会干扰我们对我们的核心目的的测试，可能导致测试不准确，或者找到别的问题导致分心和混乱。

而凭借单元测试，我们对这个action的测试可以做这么一些事情:

1. 模拟一个 state, 我们可以造出正确的、不同情况的、故意出错的 state 用于全面测试
2. 模拟网络请求, 我们可以造出正确的、不同情况的、故意出错的响应结果用于检查后续处理流程
3. 在单元测试环境中执行这个action
    1. 从模拟的 state、getters 中取出一些数据，拼装成请求参数
    2. 使用模拟返回的结果，提取需要的字段更新到 state
4. 在用例中进行检查
    1. 最终 state 是否设置正确
    2. 覆盖率是否达到 100%, 或者有逻辑分支没考虑到?

测试这个action时我们模拟了发起请求，如果我们还想测试请求是否正确执行，比如是否正确使用了http客户端，那我们应该在另一个单元测试中专门测试这个api请求，因为这已经属于另一个单元了。

## 常见场景下怎么做单元测试

接下来基于jest介绍怎么配置和执行一些常用的单元测试。

现在一个前端项目源码可能由这些部分组成:

- js模块 主要测试的内容，jest天然支持，不过对于es6及以上的语法，需要配置 ``babel-jest``
- ts模块 主要的测试内容，需要配置 ``ts-jest``，以及在 ``tsconfig.json`` 的 ``types`` 中增加 ``jest``
- css样式和文件资源 这些模块更适合通过肉眼和开发者工具进行视觉对稿, ``jest`` 可以直接模拟跳过这些内容
- 界面组件标签 对于原生DOM, jest 天然支持，可以检查其节点和值。对于基于前端框架的组件，各框架本身都提供了自己的测试方式，用于在测试环境中渲染组件节点

### 同步模块的测试

一个同步的测试代码可能是这样的:

``` js
import 模块 from 'path/to/模块'

describe('这个单元测试的名字', () => {
    it('一个测试用例的名字', () => {
        // 直接匹配
        expect(需要验证的值).toEqual(需要匹配的值)
        // 匹配列表中的对象
        expect(需要验证的列表).toEqual(expect.arrayContaining([
            expect.objectContaining({
                列表中包含的object的某个key: value,
            })
        ]))
        // 匹配抛出错误
        expect(() => {
            执行应该抛出错误的逻辑
        }).toThrow()
    })
})
```

其中 expect 提供了非常多用于检查需要的值的方法，涵盖了常量、object、array等。详细可以直接参考[官方文档](https://jestjs.io/docs/en/using-matchers)。

### 异步模块的测试

对于异步模块你可能还需要在jest的初始化脚本中引入 ``babel-polyfill``, 配置好后即可正常进行 ``async/await`` 等异步语法测试:

``` js
describe('这个单元测试的名字', () => {
    it('一个测试用例的名字', async () => {
        const res = await 执行模块
        expect(res).toEqual(expect.arrayContaining([
            expect.objectContaining({
                列表中包含的object的某个key: value,
            })
        ]))
    })
})
```

### 模拟行为

**模拟样式和文件**

样式和文件模块无法通过js执行来判断正确性，也就失去了单元测试意义，我们只需要直接跳过这类模块，保证代码执行下去即可，可以在 ``jest.config.js`` 中配置如何处理样式和文件模块:

``` js
moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js",
},
```

**模拟浏览器对象**

有时候我们的代码依赖了浏览器的全局对象(window), 比如需要读取``location.href``, 可以参考[这个问答](https://stackoverflow.com/a/54021633)。

**模拟内部函数执行**

设想这样一种情况，我们想要测试一个较复杂业务函数A的执行，这个函数内部调用了另一个函数B，而我们不想关心另一个函数B是如何执行的，只想它返回我们需要的值就够了，我们关心的是函数A是否正确执行，此时就需要模拟内部函数B的执行了。

用上面拉取账单的例子的话，就是拉账单过程中需要执行拉取账单请求，但是我们不想真的去向服务器发起请求(如果是测试支付，那就更加不能真的发请求了:D)。

模拟待测试函数内部函数的执行，``jest`` 提供了 ``spyOn``方法:

``` js
import billAction from 'path/to/billAction'
import * as billApi from 'path/to/billApi'

describe('billAction', () => {
    it('success', async () => {
        const spy = jest.spyOn(billApi, 'default')
        spy.mockResolvedValue({
            ...需要模拟返回的数据
        })
        // billAction函数内部会调用billApi 通过spyOn进行了mock
        const res = await billAction()
        expect(res).toEqual(true)
    })
})
```

示例代码中, 需要 ``spyOn`` 的函数是以 ``export default`` 方式导出的，所以需要 ``jest.spyOn(billApi, 'default')`` 来模拟。
详细关于 ``spyOn`` 的使用可以看[官方文档](https://jestjs.io/docs/en/jest-object#jestspyonobject-methodname)。

## 测试目的

笔者在《重构》书中多次被安利单元测试是如何帮助提升开发和最终代码质量的，并深有同感。不过想要在一个项目开发过程中得到单元测试技术的帮助存在一些比较现实的限制:

- 越来越多的小项目喜欢走敏捷开发路线，项目的首个MVP版本往往不考虑单元测试，很多项目甚至没有配置号单元测试环境(虽然很多cli已经集成好了)
- 并不是所有项目代码都适合被测试，相反有很多不够优秀的人编写的代码都是不可测试的，因为逻辑比较藕和以及有很多副作用
- 可能有些项目经理会觉得开发过程中被写测试用例占去时间纯属浪费

总结下来，通过单元测试加持我们需要致力于这些目的:

**保证代码可靠性** 项目还未上线就能知道代码会如何运行，这一定能有效帮助睡眠。

**覆盖率不是最重要的** 贴近真实业务和交互来编写用例, 单元测试最神圣的使命大概还是减少BUG。

**提升代码质量** 一段能被单元测试的代码，往往就是逻辑清晰，各个逻辑完美解耦，无副作用的，我们通过一个函数的注释和命名能得知这个函数是用来做什么的，而通过这个函数漂亮的单元测试用例就能证明这个函数确实是正确的做了什么的。

**方便维护** 即使一个MVP项目可能做不到同步增加测试用例，但如果是打算后续不断迭代的话，还是强烈建议第一时间给各功能都补充测试用例。因为迭代过程中往往会涉及或大或小范围的重构，这时如果有测试用例的保护，我们大可以放开手脚去进行，每改动一小点，就调整测试用例来适配新功能，而不是盲改，生怕改坏什么隐藏逻辑；又或者项目成员变更了，新成员就能直接从测试用例中知道自己将要接手的模块至少是正确执行的，而不是接手一个原本就跑不通的巨坑。回过头来，多花少量时间编写测试用例，最终很可能是能节省整体项目迭代效率、质量和体验的。
