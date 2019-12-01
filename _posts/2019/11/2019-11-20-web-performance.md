---
layout: post
title:  使用 RAIL 模型评估性能
date:   2019-11-21 13:32:13 +0800
author: yitimo
categories: javascript
tags: ["前端性能优化"]
keywords:
- 前端性能优化
description: 前端性能优化
---

## 使用 RAIL 模型评估性能

### Response 响应(用户交互)

**延迟与用户反应**

响应时间 | 结果
-|-
0 - 16 毫秒 | 人们特别擅长跟踪运动，如果动画不流畅，他们就会对运动心生反感。用户可以感知每秒渲染 60 帧的平滑动画转场。也就是每帧 16 毫秒（包括浏览器将新帧绘制到屏幕上所需的时间），留给应用大约 10 毫秒的时间来生成一帧。
0 - 100 毫秒 | 在此时间窗口内响应用户操作，他们会觉得可以立即获得结果。时间再长，操作与反应之间的连接就会中断。
100 - 300 毫秒 | 用户会遇到轻微可觉察的延迟。
300 - 1000 毫秒 | 在此窗口内，延迟感觉像是任务自然和持续发展的一部分。对于网络上的大多数用户，加载页面或更改视图代表着一个任务。
1000+ 毫秒 | 超过 1 秒，用户的注意力将离开他们正在执行的任务。
10,000+ 毫秒 | 用户感到失望，可能会放弃任务；之后他们或许不会再回来。

- 在用户注意到滞后之前您有 100 毫秒的时间可以响应用户(不适用于触摸拖动或滚动)
- 可以谨慎的使用此 100 毫秒悄悄执行其他开销大的工作
- 如果超过 500 毫秒才能完成的操作，请始终提供反馈

**场景1: 动画弹窗** 先将不渲染元素设为渲染(但透明)，等待20毫秒后渐变至不透明

**场景2: 请求** 如果请求在200毫秒内完成了，用户无感知是个请求，如果超过了，再弹loading

---

### Animation 动画

目标就是每秒生成 60 帧，每帧需要完成的事情：

JS执行 -> 样式执行 -> 布局执行 -> 绘制 -> 组合最终界面

每帧预算为 ``16`` 毫秒，但浏览器会花掉6毫秒进行绘制新帧(最后两步)，所以要在 ``10`` 毫秒内执行完代码

**场景1: 平滑滚动**
1. 每帧滚动距离 = 滚动总距离(如900px)/预想滚动时间(如300毫秒)*每帧分配的时间(10毫秒)
2. 递归requestFrameAnimation直到滚动至预想位置

**场景2: 轮播图**

---

### Idle 空闲(JS执行)

> webworker + 微任务

1. 将比较耗时/性能的代码执行放到WebWorker中
2. 将任务均匀拆分为耗时均匀的微任务，控制在50毫秒以内；如果算上与主线程通信的时间，控制在100毫秒以内

---

### Load(页面加载)

在 1000 毫秒以内呈现内容

1. 骨架屏
2. 懒加载、预加载
3. 弱网速情况
4. 关键渲染路径

**LCP度量**

> Largest Contentful Paint - 最大的内容绘制

页面渲染过程中耗时最大的内容对象。

[API文档](https://wicg.github.io/largest-contentful-paint/)

**其他度量**

- load
- DOMContentLoaded
- FCP - 首个内容绘制
- MCP - 有意义内容绘制

---

## 扩展

- [使用mp4代替gif](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/replace-animated-gifs-with-video)
- [Save-Data模式](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)
- [避免微优化JS](https://developers.google.com/web/fundamentals/performance/rendering/optimize-javascript-execution?hl=zh-cn#%E9%81%BF%E5%85%8D%E5%BE%AE%E4%BC%98%E5%8C%96_javascript) (前端框架抹平渲染性能)

``` html
<picture>
  <source srcset="/img/george-and-susan-1x.webp 1x, /img/george-and-susan-2x.webp 2x">
  <source srcset="/img/george-and-susan-1x.jpg 1x, /img/george-and-susan-2x.jpg 2x">
  <img src="/img/george-and-susan-1x.jpg" alt="LET'S NOT GET CRAZY HERE" width="320" height="240">
</picture>
```

<div id="comment-root" data-comment-id="20191020211202lSrBqALp"></div>
