---
layout: post
title:  NEO区块数据解析
date:   2018-03-02 15:12:23 +0800
author: yitimo
categories: jekyll update
tags: ["blockchain", "NEO"]
keywords:
- blockchain,
- NEO,
description: Read block data on NEO test net.
---

本文将通过NEO节点提供的``/rpc``接口中的``getblock``接口获取NEO测试网上的包含了各种类型的交易的区块数据并进行解析。

``getblock``接口支持两个参数，第一个是区块的哈希或者高度，第二个是用来指明返回哈希数据还是json数据。那么问题的关键就是哈希数据跟json数据之间的区别，NEO区块链上存储的是序列化过的哈希数据，而想要用户能看得懂区块数据就必须反序列化区块数据。

比如直接获取NEO测试网的创世区块得到的两类数据如下：

*待完成。。。*


