---
layout: post
title:  使用 neon-wallet-db + neon-js + NEO-cli /rpc 搭建轻钱包服务端
date:   2018-02-26 18:14:23 +0800
author: yitimo
categories: jekyll update
tags: ["blockchain", "NEO"]
keywords:
- blockchain,
- NEO,
description: Use neon-wallet-db, neon-js in a private NEO chain. (neon-wallet for a private NEO chain)
---

本文将搭建一个不具有任何功能的NEO轻钱包，所有的精力都仅集中于成功运行``neon-wallet-db``项目并搭配全节点的``neo-cli /rpc``接口为轻钱包客户端提供服务。
首先需要准备几个项目：
1. [neon-wallet-db](https://github.com/CityOfZion/neon-wallet-db)
2. [neon-js](https://github.com/CityOfZion/neon-js)
3. [neo-cli](https://github.com/neo-project/neo-cli)
4. 任意实现的web客户端(本文将使用``angular``)

然后是劝退部分，即笔者完成壮举准备的环境：
1. 4台debian虚拟机，均运行共识节点
2. 4台虚拟机中一台作为``RPC``节点运行提供``/rpc``接口
3. 4台虚拟机中另一台运行``neon-wallet-db``项目
4. 运行``neon-wallet-db``项目的前提如下：
  4.1 运行``mongodb``服务端
  4.2 运行``redis``服务端
  4.3 安装``python``环境（笔者为 3.6.3）（建议搭配pyenv+virtualenv）
  4.4 安装``heroku cli`` 后续将使用``heroku local``运行项目

## NEON-WALLET-DB 项目的必要性
neon社区维护的neon轻钱包项目实际上为一个 ``react`` + ``electron`` 的web项目，内部通过调用``neon-js``提供的api实现与测试网乃至主网的交互。
然后思考一下轻钱包是如何做到不同步全节点也能进行``transaction``的。
答案是不可能。这里的轻钱包不过是在远程调用``/rpc``接口罢了，全节点由远程的``neo-cli``来维护。
那么问题来了，既然所有操作其实都是在调用``/rpc``接口，那``neon-wallet-db``项目又是用来做什么的？这还得从``nel-cli``都提供了哪些接口说起：
![](http://upload-images.jianshu.io/upload_images/4740306-eeded87466cdb4a6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

没错就只有这么一些，而一个基于NEO的DAPP要做的事情就是用这么几个接口来搞事情。其中交易如何进行且不说，先关注如何查询交易记录(即区块链技术中广为流传的utxo)，毫无疑问这些utxo是包含在区块中并保存在全节点里的，那就需要一个接口来获取区块信息，也就是上面的``getblock``接口：
![](http://upload-images.jianshu.io/upload_images/4740306-1c68e52540a2a9eb.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

如图所示调用方法就是，拿区块索引来查区块信息，那如何实现查询一个地址的余额呢？用上面提供的``getbalance``接口就想得太美了，此接口得前提是要打开钱包，也就是只能获取这个``neo-cli``中打开的钱包的余额。真正做法是——遍历所有区块所有``utxo``自己算。这就是为什么还需要``neon-wallet-db``的原因，需要它来事先遍历、存储好uxto等数据，那么只要请求其提供的接口，就可以直接获取其处理过的方便使用的数据，而不需要遍历NEO全节点百万计(截至目前的测试网)的区块信息了。

*未完待填坑*
## 运行私链共识节点
## 配置 neon-wallet-db 以及 neon-js
## 顺利接入私链
