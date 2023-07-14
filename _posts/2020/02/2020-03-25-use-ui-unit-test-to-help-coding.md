---
layout: post
title: 测试react组件
date: 2020-02-27 22:35:12 +0800
author: yitimo
categories: frontend
tags: ["frontend", "unit test", "jest", "react"]
keywords:
- frontend,
- unit test,
- jest,
- react,
description: unit test for  UI components.
---

## 快照测试

一般UI组件的测试方法都比较相似，React组件也是如此。渲染可视化的UI界面会需要我们运行起整个app(即真正运行应用然后用肉眼进行测试)，而我们可以使用测试渲染器来快速生成React组件树的序列化结果。比如下面这样测试一个组件``<Link />``:

``` js
import React from 'react';
import Link from '../Link.react';
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const tree = renderer.create(
    <Link page="http://www.facebook.com">Facebook</Link>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

首次运行测试时，jest会创建一个快照文件，看起来像这样:

``` js
exports[`renders correctly 1`] = `
<a
  className="normal"
  href="http://www.facebook.com"
  onMouseEnter={[Function]}
  onMouseLeave={[Function]}
>
  Facebook
</a>
`;
```

### 这个快照产物应该被进行git提交，并且需要参与进code review过程

jest将快照格式化成了比较可读的格式。在随后的测试运行时，jest会直接比较渲染的输出是否和上一次的快照匹配。如果匹配一致了，则测试通过。如果不匹配了，则可能:

1. 存在一个组件展现的BUG了(组件存在BUG导致两次渲染的结果不一样)
2. 组件的实现改变了导致快照需要被更新

如果是情况2，可以传入 ``-u`` 参数表明这次测试是用来更新快照的，还可以传入 ``--testNamePattern`` 来只更新匹配名称的快照。**需要谨慎操作，不要无意将错误的快照更新了。**

### 测试结果应该是恒定的

测试应该是固定不变的。意思是，多次运行同一个未经修改的组件的测试，都应该得到相同的快照产出。你需要保证不要将一些动态字段加入快照，比如时间戳等，可能每次运行都会不同，此时需要对其进行模拟:

``` js
Date.now = jest.fn(() => 1482363367071);
```

这样模拟了时间函数后，每次运行测试用例，时间值都会是固定的，也就能得到相同的快照了。

### 在持续集成系统中, 快照不会被自动编写

除非手动指定 ``--updateSnapshot``, 当jest在持续集成系统中运行时，新快照都不会被自动编写。快照应该被当作是代码的一部分，应该在外部被测试通过，而不应该在持续集成系统中来更新快照。

### 使用场景

1. 在不需要或不方便实际运行应用时保证没有把一个组件改坏
    1. 如果是真的需要修改(比如样式、命名、文案)的，也可以用来保证被修改的部分正是需要修改的，然后更新快照
    2. 所有动态的值(接口数据、时间函数等), 都应该进行模拟，保证快照是一致的
2. 前端组件库会被很多其他使用者应用而无法实际复现运行，快照能有效保证没有把组件库的展现改坏
3. 约束我们写无状态的组件

## 浅渲染的组件测试

### 劝退

即使很多人声称``enzyme``为代表的的各种组件可以用来很容易的进行组件测试，但是对于UI组件这样以展示为目的的东西(不同于js模块)，把组件先渲染成虚拟DOM，并在脑海里想象这个虚拟DOM，然后用expect来验证虚拟DOM的各种属性，以及交互造成的属性变化，始终是抽象的。

- 如果条件允许，能直接运行起应用亲自用肉眼和手指来测试一定是最高效直观的。
- 组件测试经常会导致一个问题: 编写(修改)测试的时间远远超过了编写组件本身的时间。

**如何避免组件测试**

将复杂应用拆分成多个微应用:

- 每个应用都能独立运行
- 应用之间有规范的通信方式(url传参、storage、后端缓存)
- 应用本身能很容易的运行起来(高可配置性, 可以轻松模拟环境、来自其他应用的传参、向其他应用传参)
- 将应用内的多数组件提纯，然后使用快照测试

### 没劝住

我们还可以这样进行测试: 将测试组件渲染成虚拟DOM，对这个虚拟DOM进行各种交互和检查，由于目的只是测试当前组件，所以只需要进行浅渲染，即所有子组件都不进行渲染原样输出即可。

``` js
import {shallow} from 'enzyme';

describe('Enzyme Shallow', function () {
  it('App\'s title should be Todos', function () {
    let app = shallow(<App/>);
    expect(app.find('h1').text()).to.equal('Todos');
  });
};
```

上述代码浅渲染了``<App />``组件, 并检查其是否存在标题为``Todos``的``h1``元素。过程比较抽象，由于没有实际运行应用，只能在脑海里想象这个组件会渲染成什么样，然后用你觉得足够的``expect``来证明。
