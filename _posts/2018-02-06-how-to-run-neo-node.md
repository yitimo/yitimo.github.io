---
layout: post
title:  NEO全节点客户端的基本使用，节点的运行和共识达成
date:   2018-02-06 11:46:23 +0800
author: yitimo
categories: BlockChain
tags: ["blockchain", "NEO"]
keywords:
- blockchain,
- NEO,
description: Basic introduce of NEO series client. How to run NEO node & get the CLI consensused.
---

截至目前NEO产品至少在技术层面不能算是成熟，从其官方文档的种种错漏以及频繁更改就可以看出来，本文是笔者经过近几周的NEO节点使用后的一些总结。NEO生态的使用从学习路线来看分为以下几部分：
1. 使节点达成共识并产生区块。
2. 在私链上完成多重签名实现初始NEO资产的提取。
3. 掌握GAS机制并收集GAS，进而开始使用智能合约。
4. 实现三种资产的创建——Token，Share和NEP-5。
5. NEP-6的使用，即轻钱包开发，以及扩展官方CLI/GUI的诸多功能缺陷。

本文将集中于前两步，也就是最基本的使NEO节点达成共识，即其所谓的DBFT，以及在GUI中完成多重签名并提取一亿个NEO。

## 成功运行节点

在``CLI 2.7.1``及``GUI 2.6.0``下想要成功运行节点确实足够作为一章来总结。

### 运行CLI

方法1是直接``clone``GitHub项目，从源码运行CLI。
方法2是下载其``Realise``，直接运行其``.exe``文件。

```
git clone https://github.com/neo-project/neo-cli.git
cd neo-cli
dotnet restore
cd neo-cli
dotnet run
```
两种方式尝试运行结果是报错的，因为缺少了``libleveldb``的dll文件。

![DotNet Restore](/assets/images/201802/cli-restore.png)

![Error](/assets/images/201802/cli-error.png)

解决的办法是得到这个``libleveldb.dll``文件放到输出目录下，最快的办法是去下载 [GUI的Release包](https://github.com/neo-project/neo-gui/releases)，里面就包含了这个缺失的``dll``，更高级的办法就是自己下载``libleveldb``并编译得到。

![GUI的Release中包含了缺失的dll](/assets/images/201802/dll-in-gui.png)

然后就运行成功了 : )

![CLI运行成功](/assets/images/201802/cli-success.png)

### 运行GUI

首先铭记一句话——GUI只能运行于``windows``。原因是其实现是``WPF``。
然后再记一句话——只有GUI能进行合约部署、签名等操作。同时CLI唯一有意义且只能由CLI做到的事情就是``建立共识产生区块``。

接受了以上事实后，还得知道一件事，就是纯净安装的Windows(最好是win10)仍然是无法成功运行GUI的。需要安装以下东西：

* 源码下的GUI同样缺少``libleveldb.dll``
* DotNetCore SDK
* [依赖1](https://www.microsoft.com/de-de/download/details.aspx?id=14632)
* [依赖2](https://www.microsoft.com/de-de/download/details.aspx?id=5555)

否则的话是无法打开钱包文件的。

## 共识节点配置以及客户端重要目录

这里粗暴概括五个NEO客户端中对重要的文件(目录)：

1. ``Chain目录`` 是共识产生的区块文件，记录交易
2. ``Index目录`` 是较早的区块文件转化的索引文件，相当于较早的区块就不存放在Chain中占空间而是仅作为索引在此了，所以也参与组成区块高度
3. ``config.json`` 主要是为了在这里配置P2P的交互端口，要保持一致
4. ``protocol.json`` 配置共识节点，包括节点的IP/端口以及公钥，保持一致了才能建立起共识，以及让其他节点以相同配置加入

## 相对方便地搭建用于测试的私链的办法

目前想要测试NEO的私链谈不上困难，但是麻烦是一定的，因为有上文中两个蛋疼的前提(GUI和CLI各自能做和不能做的事情)。

除此之外还要考虑NEO节点共识机制的限制，也就是能达成最小共识的节点数。也就是``3/4``共识。具体的多方签名流程参照[官方文档](http://docs.neo.org/zh-cn/node/private-chain.html)。

其中一个办法是：
1. 准备4个windows机器或虚拟机，各自先运行CLI达成共识。
2. 断开其中一个CLI进入GUI，此时仍满足``3/4``共识数。发起多方签名。
3. 退出GUI进入CLI重新加入共识，并依次断开两台CLI进入GUI执行签名操作。
4. 满足3个签名后就可以发起广播，确认后就完成了这个多方签名过程。

此办法显然十分繁琐，需要频繁切换CLI与GUI且频繁干扰全网的共识，效率十分之低。

更优雅的办法用一句话概括就是：

* 运行4个CLI(虚拟机中或其他机器)，然后在宿主机(Windows)中运行GUI，分别操作4个CLI中参与共识的钱包。

这得益于GUI可以打开在其他机器中参与共识的钱包这个仅有的好处。除此之外目前整个NEO的所有东西可以说是非常废柴了。

## 总结

本文更主要的目的在于整理NEO节点运行需要解决的问题，以及总结笔者自己使用NEO官方文档时遇到并解决的困惑。关于更多基础的NEO开发内容还是要亲自浏览[NEO官网](https://neo.org/)才好，浏览的时候要永远铭记——这是一个残缺不全的文档，并且有很多内容都已经更改得乱套了，并保持关注文档的更新。
