---
layout: post
title: Flexbox 弹性布局是否更慢
date: 2022-01-22 11:21:12 +0800
author: yitimo
categories: frontend
tags: ["frontend"]
keywords:
- frontend,
description: Is flexbox layout slower?
---

原文: [Flexbox弹性布局并不慢(Flexbox layout isn't slow)](https://developers.google.com/web/updates/2013/10/Flexbox-layout-isn-t-slow)

原文结论是: ``display: box`` 比 ``display: flex`` 慢 2.3 倍.

## 实测

但实际测试下来, 在当下最新的 chrome 浏览器下, ``display: box`` 与 ``display: flex`` 表现是接近的, 甚至有较多情况下前者性能还更佳.

demo里分别用 block, box, flex 三种布局渲染大量节点(500个), 并频繁修改容器宽度来触发重新渲染, 截10帧取平均值来分析性能:

> block布局表现: 17.9ms/帧

![block布局](/assets/images/202201/block-layout-10f.jpg)

> box布局表现: 17.9ms/帧

![box布局](/assets/images/202201/box-layout-10f.jpg)

> flex布局表现: 21.4ms/帧

![flex布局](/assets/images/202201/flex-layout-10f.jpg)

## 结论

从实验结果来看, 这个实验做了个寂寞:

- 三种布局性能差距其实很小(虽然确实有区分)
- 在不同的浏览器内核, 不同的内存CPU占用情况下表现都会出现波动(但都应该比较接近)

但也提供了一些建议:

- 避免微优化
- tools, not rules

抛开布局本身的性能差异, 应该关注其他更有效的性能优化方案, 比如:

- 控制页面内的总节点数和嵌套层级
- 控制更新UI的频率

回归到三种布局本身的特性差异上, 个人建议如下:

- 上层容器的布局更适合用 flex, 来大致划分容器内的各个板块
- 细节元素没必要用 flex, block 就可以很清晰的实现了
- 滥用 flex 会导致样式声明变复杂和抽象, 想象一下所有(非最后一级的)节点都有个 display: flex 样式加一堆 flex 的辅助样式
- 至于 box 布局, 仅用在降级兼容 flex
