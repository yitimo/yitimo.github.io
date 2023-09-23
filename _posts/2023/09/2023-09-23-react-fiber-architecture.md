---
layout: post
title: 【翻译】React Fiber 架构
date: 2023-09-23 15:51:12 +0800
author: yitimo
categories: frontend
tags: ["frontend", "react"]
keywords:
- frontend,
- react,
description: Translation of <React Fiber Architecture>.
---

[原文链接: React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture#react-fiber-architecture)

> 原文最后更改与 2016 年, 可能已过时.

## 简介

``React Fiber`` 是即将到来的 react 核心算法的重新实现. 是 react 团队两年来的研究成果.

``React Fiber`` 的目标是增加比如 动画、布局、手势 这些领域的适配度. 首要特性就是 **增量渲染**: 将渲染任务拆分为多个 chunk, 然后扩散到多个帧来完成.

其他核心特性还包括了发生新更改时暂停、终止或复用工作; 指定不同类型更新工作的优先级; 新的``并发 primitives``.

## 关于此文档

Fiber 介绍了一些新颖的概念, 通过代码可能很难去完全理解. 此文档一开始只是我关注 react 项目里的 Fiber 实现时收集的一些笔记. 当有了一定积累后, 我发现这可能对其他人也会有帮助.

我会尽可能用最直白的语言, 避免专业术语, 也会尽可能关联到额外的相关信息.

注意我并没有在 react 团队里, 不会有任何权威性. **这不是一篇官方文档.** 为保证准确性我有请 react 团队成员审阅.

同时这是一个还在进行中的工作. **Fiber is an ongoing project that will likely undergo significant refactors before it's completed.** Also ongoing are my attempts at documenting its design here. Improvements and suggestions are highly welcome.

My goal is that after reading this document, you will understand Fiber well enough to follow along as it's implemented, and eventually even be able to contribute back to React.

### 前置阅读

在继续阅读之前强烈建议先熟悉这几条内容:

- [react组件, 元素, 实例](https://facebook.github.io/react/blog/2015/12/18/react-components-elements-and-instances.html) - "组件"概念经常被谈论到. 掌握这一概念至关重要.
- [协调算法](https://facebook.github.io/react/docs/reconciliation.html) - 对 react 协调算法的高阶解释.
- [react 基础理论概念](https://github.com/reactjs/react-basic) - 对react概念模型的轻量讲述. 不涉及具体实现, 但慢慢会体现出作用.
- [react 设计原则](https://facebook.github.io/react/contributing/design-principles.html) - 特别要关注讲述调度的章节. 这对解释为何要用 fiber 有帮助.

## 综述

根据前置阅读章节, 先一起来梳理以下概念

### 什么是协调算法

react 使用**协调算法**来比较两棵树的差异, 进而计算哪些部分需要更改.

**更改**通常是 setState 的结果, 最终作为重新渲染的结果.

react api 的核心思想就是判断更改是否会让应用重新渲染. This allows the developer to reason declaratively, rather than worry about how to efficiently transition the app from any particular state to another (A to B, B to C, C to A, and so on).

Actually re-rendering the entire app on each change only works for the most trivial apps; in a real-world app, it's prohibitively costly in terms of performance. React has optimizations which create the appearance of whole app re-rendering while maintaining great performance. The bulk of these optimizations are part of a process called **reconciliation**.

Reconciliation is the algorithm behind what is popularly understood as the "virtual DOM." A high-level description goes something like this: when you render a React application, a tree of nodes that describes the app is generated and saved in memory. This tree is then flushed to the rendering environment — for example, in the case of a browser application, it's translated to a set of DOM operations. When the app is updated (usually via ``setState``), a new tree is generated. The new tree is diffed with the previous tree to compute which operations are needed to update the rendered app.

Although Fiber is a ground-up rewrite of the reconciler, the high-level algorithm [described in the React docs](https://facebook.github.io/react/docs/reconciliation.html) will be largely the same. The key points are:

- 不同的组件类型会生成不同的两颗组件树. react 不会去 diff 比较它们, 而是直接完整替换为新的组件树.
- 一个列表的diff依赖于key. key需要是 "固定的, 可预测的, 唯一的".

### 协调 vs 渲染

The DOM is just one of the rendering environments React can render to, the other major targets being native iOS and Android views via React Native. (This is why "virtual DOM" is a bit of a misnomer.)

The reason it can support so many targets is because React is designed so that reconciliation and rendering are separate phases. The reconciler does the work of computing which parts of a tree have changed; the renderer then uses that information to actually update the rendered app.

This separation means that React DOM and React Native can use their own renderers while sharing the same reconciler, provided by React core.

Fiber reimplements the reconciler. It is not principally concerned with rendering, though renderers will need to change to support (and take advantage of) the new architecture.

### 调度

**scheduling**: the process of determining when work should be performed.

**work**: any computations that must be performed. Work is usually the result of an update (e.g. ``setState``).

React's [Design Principles](https://facebook.github.io/react/contributing/design-principles.html#scheduling) document is so good on this subject that I'll just quote it here:

> In its current implementation React walks the tree recursively and calls render functions of the whole updated tree during a single tick. However in the future it might start delaying some updates to avoid dropping frames.
>
> This is a common theme in React design. Some popular libraries implement the "push" approach where computations are performed when the new data is available. React, however, sticks to the "pull" approach where computations can be delayed until necessary.
>
> React is not a generic data processing library. It is a library for building user interfaces. We think that it is uniquely positioned in an app to know which computations are relevant right now and which are not.
>
> If something is offscreen, we can delay any logic related to it. If data is arriving faster than the frame rate, we can coalesce and batch updates. We can prioritize work coming from user interactions (such as an animation caused by a button click) over less important background work (such as rendering new content just loaded from the network) to avoid dropping frames.

关键点有这些:

- 在 UI 层, 并不是所有更改都需要被立即应用到; 事实上, 这样做会很浪费, 会造成掉帧并影响用户体验.
- 不同类型的更改有不同的优先级 — 比如动画更新需要比数据存储更快完成.
- ``push-based`` 的方式需要应用(即开发者)来决定如何协调工作. ``pull-based`` 方式则允许框架(react)更智能地帮你做这些决定.

react目前并没有以重要的方式来使用调度; 一次更改会让整个子组件树都立即被重新渲染. 检查 react 的核心算法来使用调度能力就是 fiber 的驱动理念.

---

现在我们准备好了深入 react fiber 的实现. 下一章会更有技术深度.

## 什么是 Fiber

We're about to discuss the heart of React Fiber's architecture. Fibers are a much lower-level abstraction than application developers typically think about. If you find yourself frustrated in your attempts to understand it, don't feel discouraged. Keep trying and it will eventually make sense. (When you do finally get it, please suggest how to improve this section.)

Here we go!

---

We've established that a primary goal of Fiber is to enable React to take advantage of scheduling. Specifically, we need to be able to

- 暂停当前工作, 迟一点再回来.
- 指定不同类型工作的优先级.
- 复用之前完成了的工作.
- 终止不再需要的工作.

为了做到上述这些, 我们首先需要能打断各个单元里工作的方法. 某种意义上, fiber 就是做这个的. 一个 fiber 代表了一个 **工作单元**.

为了更进一步, 我们先回看章节: [React components as functions of data](https://github.com/reactjs/react-basic#transformation). 常规表达为:

```
v = f(d)
```

It follows that rendering a React app is akin to calling a function whose body contains calls to other functions, and so on. This analogy is useful when thinking about fibers.

The way computers typically track a program's execution is using the [call stack](https://en.wikipedia.org/wiki/Call_stack). When a function is executed, a new stack frame is added to the stack. That **stack frame** represents the work that is performed by that function.

When dealing with UIs, the problem is that if too much work is executed all at once, it can cause animations to drop frames and look choppy. What's more, some of that work may be unnecessary if it's superseded by a more recent update. This is where the comparison between UI components and function breaks down, because components have more specific concerns than functions in general.

Newer browsers (and React Native) implement APIs that help address this exact problem: ``requestIdleCallback`` schedules a low priority function to be called during an idle period, and ``requestAnimationFrame`` schedules a high priority function to be called on the next animation frame. The problem is that, in order to use those APIs, you need a way to break rendering work into incremental units. If you rely only on the call stack, it will keep doing work until the stack is empty.

Wouldn't it be great if we could customize the behavior of the call stack to optimize for rendering UIs? Wouldn't it be great if we could interrupt the call stack at will and manipulate stack frames manually?

That's the purpose of React Fiber. Fiber is reimplementation of the stack, specialized for React components. You can think of a single fiber as a **virtual stack frame**.

The advantage of reimplementing the stack is that you can [keep stack frames in memory](https://www.facebook.com/groups/2003630259862046/permalink/2054053404819731/) and execute them however (and whenever) you want. This is crucial for accomplishing the goals we have for scheduling.

Aside from scheduling, manually dealing with stack frames unlocks the potential for features such as concurrency and error boundaries. We will cover these topics in future sections.

下一章我们将更多去关注fiber的结构.

### fiber 结构

*Note: as we get more specific about implementation details, the likelihood that something may change increases. Please file a PR if you notice any mistakes or outdated information.*

In concrete terms, a fiber is a JavaScript object that contains information about a component, its input, and its output.

A fiber corresponds to a stack frame, but it also corresponds to an instance of a component.

Here are some of the important fields that belong to a fiber. (This list is not exhaustive.)

#### ``type`` 和 ``key``

The type and key of a fiber serve the same purpose as they do for React elements. (In fact, when a fiber is created from an element, these two fields are copied over directly.)

The type of a fiber describes the component that it corresponds to. For composite components, the type is the function or class component itself. For host components (``div``, ``span``, etc.), the type is a string.

Conceptually, the type is the function (as in ``v = f(d)``) whose execution is being tracked by the stack frame.

Along with the type, the key is used during reconciliation to determine whether the fiber can be reused.

#### ``child`` 和 ``sibling``

These fields point to other fibers, describing the recursive tree structure of a fiber.

The child fiber corresponds to the value returned by a component's ``render`` method. So in the following example

``` jsx
function Parent() {
  return <Child />
}
```

The child fiber of ``Parent`` corresponds to ``Child``.

The sibling field accounts for the case where ``render`` returns multiple children (a new feature in Fiber!):

``` jsx
function Parent() {
  return [<Child1 />, <Child2 />]
}
```

The child fibers form a singly-linked list whose head is the first child. So in this example, the child of ``Parent`` is ``Child1`` and the sibling of ``Child1`` is ``Child2``.

Going back to our function analogy, you can think of a child fiber as a [tail-called function](https://en.wikipedia.org/wiki/Tail_call).

#### ``return``

The return fiber is the fiber to which the program should return after processing the current one. It is conceptually the same as the return address of a stack frame. It can also be thought of as the parent fiber.

If a fiber has multiple child fibers, each child fiber's return fiber is the parent. So in our example in the previous section, the return fiber of ``Child1`` and ``Child2`` is ``Parent``.

#### ``pendingProps`` 和 ``memoizedProps``

Conceptually, props are the arguments of a function. A fiber's ``pendingProps`` are set at the beginning of its execution, and ``memoizedProps`` are set at the end.

When the incoming ``pendingProps`` are equal to ``memoizedProps``, it signals that the fiber's previous output can be reused, preventing unnecessary work.

#### ``pendingWorkPriority``

A number indicating the priority of the work represented by the fiber. The [ReactPriorityLevel](https://github.com/facebook/react/blob/master/src/renderers/shared/fiber/ReactPriorityLevel.js) module lists the different priority levels and what they represent.

With the exception of ``NoWork``, which is 0, a larger number indicates a lower priority. For example, you could use the following function to check if a fiber's priority is at least as high as the given level:

``` jsx
function matchesPriority(fiber, priority) {
  return fiber.pendingWorkPriority !== 0 &&
         fiber.pendingWorkPriority <= priority
}
```

This function is for illustration only; it's not actually part of the React Fiber codebase.

The scheduler uses the priority field to search for the next unit of work to perform. This algorithm will be discussed in a future section.

#### ``alternate``

**flush**: 重置一个已经渲染输出到屏幕上的 fiber.

**work-in-progress**: A fiber that has not yet completed; conceptually, a stack frame which has not yet returned.

At any time, a component instance has at most two fibers that correspond to it: the current, flushed fiber, and the work-in-progress fiber.

The alternate of the current fiber is the work-in-progress, and the alternate of the work-in-progress is the current fiber.

A fiber's alternate is created lazily using a function called ``cloneFiber``. Rather than always creating a new object, ``cloneFiber`` will attempt to reuse the fiber's alternate if it exists, minimizing allocations.

You should think of the ``alternate`` field as an implementation detail, but it pops up often enough in the codebase that it's valuable to discuss it here.

#### ``output``

**宿主组件**: react 应用的叶子节点. 他们会被具体渲染到环境里 (比如在浏览器里就是 ``div``, ``span``这些). 在 JSX 里,  他们是用小写的标签名来表示.

从概念上讲, fiber 的输出即是一个函数的返回值.

每个 fiber 最终都有一个输出, 但只有 **宿主组件** 的叶子节点的输出才会被创建. The output is then transferred up the tree.

输出即是实际给到渲染器的, 用来完整更改到渲染环境里的东西.  渲染器的责任就是定义输出会被怎样创建和更新.

## 未来计划

目前这就是全部了, 但此文档还远没有完成. 后续章节将会讲述一次更新的生命周期内使用的算法. 包含了这些话题:

- 调度器如何找到并执行下一个工作单元.
- fiber 树如何跟踪和传播优先级.
- 调度器如何知道何时要暂停和继续工作.
- 工作如何被重置和标记为完成.
- 副作用如何工作(比如生命周期钩子).
- 什么是携程, 以及如何被用来实现比如 context 和 layout 等这些特性.

## 相关视频

[What's Next for React (ReactNext 2016)](https://youtu.be/aV1271hd9ew)
