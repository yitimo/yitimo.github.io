---
layout: post
title:  NEO全节点客户端的基本使用，节点的运行和共识达成
date:   2018-02-06 11:46:23 +0800
author: yitimo
categories: jekyll update
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

## 相对方便地搭建用于测试的私链的办法

completing...
