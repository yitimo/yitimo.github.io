---
layout: post
title: 在eggjs中管理微信token
date: 2020-06-12 15:32:12 +0800
author: yitimo
categories: nodejs
tags: ["nodejs"]
keywords:
- nodejs,
description: Manage Wechat token in eggjs.
---

本文基于eggjs的[多进程](https://eggjs.org/zh-cn/core/cluster-and-ipc.html)来梳理如何妥善管理会失效的第三方token(如微信平台accessToken)。

eggjs运行后会有3种进程在工作:

1. **master进程** 统筹整个应用, 只做顶层调度工作, 如果master挂了, 即代表应用挂了
2. **agent进程** 做一些必须单例进行的工作, 比如写本地文件, 比如请求获取最新的外部访问令牌(如果让worker来做那不同worker的最新token会相互冲突)
3. **worker进程** 做日常业务, 可以支持高并发, 可以复制多个一起工作, 其中一个挂了或在工作中就换另一个


## 微信开发

微信服务的接口调用大都依赖一个会失效的的访问令牌(accessToken), 这个token一般过期时间为2小时, 并且存在一个机制:

> 当token快过期时, 可以请求获取最新的token, 这时新老token都有效, 老token5分钟后失效。

此时如果我们简单的在代码中维护这个token的话会遇到一些问题:

- 一开始一切正常, 5分钟后接口开始偶现请求失败
- 一天内accessToken的获取次数量很大(如果加了失效重试机制, 那大概每5分钟就会有一大波刷新token的请求)
- 如果运气好, 使用了单核的docker容器, eggjs也随之只分配一个worker进程, 那似乎使用上一切正常, 但日后一旦给容器增加worker数, 问题就会开始出现

## 正确使用

为了不让多个worker进程的accessToken相互冲突, 必须只由单个进程来做token更新的工作, 并同步给所有的worker进程, 保证大家都能使用同一份最新的token。

比较合适的就是在agent进程中做这件事:

1. agent进程维护accessToken和过期时间, 并同步给所有worker(发消息)
2. worker发现token已经快过期, 发消息通知agent, agent更新token并再次同步给所有worker
3. 可能会有多个worker同时通知agent需要更新token, 要做好保护, 利用好新老token可共存5分钟这个特性

## 使用定时任务

在由worker主动通知agent来更新accessToken的基础上, 还可以增加定时任务来更新accessToken, 比如定时每10分钟检查一次token是否快过期了, 如果快过期了就随机指派一个worker进程进行更新, 并同步给所有worker。

## 终极方案

![终极方案](/assets/images/202006/20200612151756.jpg)

- 由agent来单例地持久化存储accessTtoken, 启动时也可以恢复并同步给所有worker
- 定时任务定期检查accessToken, 更新并通知所有worker(包括agent)
- worker更新token后正常使用, agent还要将其持久化存储起来, 方便外部调试、跨应用等
- 遇到意外导致token中途失效时, worker可以主动通知agent进程, 由agent来主动执行一次定时任务(如果多个worker同时做这件事, 也能靠agent待操作来节流)

## 一定要这么做吗

**mysql**

mysql数据库本身支持多个连接, 所以应用大可以给每个worker都建立一个到mysql的连接, 这样可以提高数据库操作效率。

**总结**

- 多进程间的生命周期完全独立, 所以除了进程间通信之外没有办法共用变量和实例。
- 对于部分外部token来说, 同时获取两个必有一个会冲突, 那就必须只由单个进程维护, 并同步给所有进程, 而不是所有进程各自抢占资源。
- 对于支持多连接的场景, 则可以每个进程各自拥有一个连接, 以享受并发带来的效率提升。
