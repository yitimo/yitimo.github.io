---
layout: post
title: 移动端h5音/视频自动播放兼容
date: 2020-07-10 17:20:12 +0800
author: yitimo
categories: frontend
tags: ["frontend"]
keywords:
- frontend,
description: Audio/video autoplay in h5 mobile.
---

## 主流浏览器的做法

如果视频设置了静音, 则可以自动播放。
然后通过用户点击来手动将视频取消静音, 则视频可以带声音继续正常播放。

> 但是如果没有用户交互, 先将视频静音然后直接通过setTimeout来取消静音, 视频会被暂停。

## 微信内兼容

目前(截止2020-07-18)微信浏览器内的表现又和系统浏览器不同。其表现为:

1. 即使视频设置了静音, 也可能不能自动播放, 而且直接黑屏, 什么事件都不会触发。
2. 页面加载完成后动态插入的video标签都不能播放, 一律黑屏, 除非手动交互。

最终调研得到的结论是:

1. 微信浏览器内可监听 ``WeixinJSBridgeReady`` 事件, 事件回调中 ``1秒`` 内插入的所有video标签都能够直接执行 ``play()`` 做到自动播放(甚至不用静音)。
2. 用户点击事件后 ``1秒`` 内可以执行视频的 ``play()`` 做到播放控制, 要是等待超过1秒也是没用的。

## 最佳实践

最终兼容移动端包括微信H5、小程序webview的视频自动播放方案如下:

1. 页面上同时存在5个video标签, 超过5个视频播放需求时, 动态切换video的src实现(动态切换src后仍可以控制播放, 但动态插入就不行了)
    - 比如短视频上下滑动切换的场景, 实际是5个video不断的改变位置和src来实现
2. 视频的 ``play()`` 会返回一个 Promise, 发现播放失败时, 将视频暂停(微信内暂停, 非X5内核浏览器可以选择将视频静音)
3. 初始化时最快速度准备好视频标签添加到页面上
4. 利用 ``WeixinJSBridgeReady`` 事件, 回调后等待尽可能久(比如950毫秒), 然后用``getElementById``等方式找到页面中需要自动播放的video标签, 将其播放

``` ts
/**
 * 尽可能早的监听微信环境 自动播放页面中的视频
 * - 如果不是微信浏览器 此事件永不触发 需要手动 .play()
 */
document.addEventListener('WeixinJSBridgeReady', async () => {
  console.warn('请在1000毫秒内添加video标签')
  setTimeout(() => {
    let played = false
    let preLoaded = 0
    const videos = document.getElementsByTagName('video')
    for (let i = 0; i < videos.length; i += 1) {
      const video = videos.item(i)
      if (!video) {
        // eslint-disable-next-line no-continue
        continue
      }
      if (video.className.indexOf('playing') > -1) {
        // 这里通过特定的class名判断是否需要自动播放 可以改用自己想要的方式判断
        video.play()
        played = true
      } else {
        // 对于不需要播放的视频 还可以进行预加载
        video.load()
        preLoaded += 1
      }
    }
    console.warn(`自动播放${played ? '成功' : '失败'}, 预加载了${preLoaded}个视频`)
  }, 950)
}, false)
```

## 相关链接

- [ios 7.0.8 公众号页面无法自动播放 audio了？](https://developers.weixin.qq.com/community/develop/doc/000cec6061c9f846e07929c7551400)
- [微信 H5 页面在安卓环境下 video 无法自动播放视频，该如何解决？](https://www.v2ex.com/t/638103)
