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

## 运行私链共识节点

私链的运行比较简单，下载官方的``neo-cli``的``release``就可以，运行若出现问题(可能性很大)需要积极浏览官方文档和``github README``排查。

4个共识节点的``protocol.json``配置须保持一致，内容为节点ip地址和对应的共识地址公钥，这样才可能建立最小共识进而产生区块。

其中还要选择一个共识节点运行``/rpc``接口，命令为``dotnet neo-cli.dll /rpc``，然后实际使用的rpc接口就是``http://192.168.1.x:20332``(``rpc``节点ip以及默认端口).

官方的[私链搭建文档](http://docs.neo.org/zh-cn/node/private-chain.html)内容有些跳跃，让人搞不清何时用``neo-cli``还是``neo-gui``。其实回归字面共识的达成无非就是4个``neo-cli``节点达成共识每隔15秒新增一个区块，没有``neo-gui``什么事儿。实际上``NEO``的测试网估计也是``protocol.json``里那几个节点在跑``neo-cli``，然后广大开发者用``cli``或``gui``去连接。那搭建私链也是一样，4台共识节点必不可少(什么共识后可以减为3台这种话直接忽略)。

笔者这边就是捣鼓了4个linux虚拟机，然后在外部windows下连接上这个私链：

![4 linux VMs](/assets/images/201803/4-linux-vm.png)

然后就只要保证四个节点的区块数据一致，``protocol.json``配置一致，就可以任意连接到这个私链，甚至可以删掉全部的区块数据来重置这条私链。

## 配置 neon-wallet-db 以及 neon-js

共识节点的运行是整条私链的根本了，利用其提供的``/rpc``接口可以做到所有事情，而``neon-wallet-db``是用来缓存私链中的区块数据以免除某些需要遍历区块数据的操作(比如查询余额)。

首先直接克隆这两个项目:

```
git clone https://github.com/CityOfZion/neon-js.git

git clone https://github.com/CityOfZion/neon-wallet-db.git
```

### neon-js的修改

neon-js默认会设置几个远程的``/rpc``服务端以及运行着``neon-wallet-db``的服务端。
这里直接修改``src/api/neonDB.js``以及``src/api/neoscan.js``中的这个方法：

![修改为私链下的地址](/assets/images/201803/change-end-point-1.png)

这个地址就是之后运行``neon-wallet-db``项目的地址了。

### neon-wallet-db的修改

neon-wallet-db 很厉害，使用``heroku``来搭建，一个命令``heroku local``搞定，然后就是要在一个干净的linux系统下解决报的错了。

首先劝退，这东西在windows下安装比linux下要麻烦一些，因为涉及了``python``、``heroku``以及几个非关系型数据库。

1. 保证安装了``heroku cli``
2. 安装``MongoDB``，全都使用默认配置，运行服务即可
3. 安装``Redis``，使用默认配置，运行服务即可
4. 可以再安装``Memcache``，不过笔者不想再挑战多一个数据库了，直接忽略也可以
5. 安装``python 3``，笔者为``3.6.3``，搭配了``pyenv + virtualenv``

准备完毕后保证neon-wallet-db目录下的python环境为``3.6.3``，然后
```
pip install -r requirements.txt
```

修改``api/util.py``:

![修改为私链的rpc地址](/assets/images/201803/change-util.png)

修改``api/db.py``:

![修改为自己的数据库配置](/assets/images/201803/change-db.png)

禁用``memcache``:

![禁用memcache](/assets/images/201803/disable-memcache.png)

疑问:

代码中涉及到``os.environ.get``方法的操作会抛出异常，这受限于笔者对``python``项目的理解不足，所以直接全都删掉，写死了配置。

下一步操作是手动同步一下区块，新建一个``rebuild.py``:

```
from apscheduler.schedulers.blocking import BlockingScheduler
from rq import Queue
from api import redis_db as conn
from api.blockchain import storeLatestBlockInDB, getBlockCount, blockchain_db, storeBlockInDB, checkSeeds, get_highest_node

for i in range(0,5) :
  storeBlockInDB(i)
```

其中的 ``range(0, 5)`` 为想要遍历的高度，也就是，手动把 1~5 的区块数据给存储下来，直接执行``python rebuild.py``即可。对于区块中又大量数据的，可以这么做先自行存储数据，然后运行整个项目时再从已存储高度继续。为了做到这一步还得把项目里几个地方的区块高度值都对应起来：

![对应区块高度](/assets/images/201803/init-py.png)

## 然后可以做什么
一切顺利的情况下执行``heroku local``，应该就会看见三种颜色的log在不停跳动了。然后确保log中没有错误，并尝试访问接口``/v2/block/height``，如果高度跟私链中真实高度一致，那就完美了。

至此我们拥有了三个神器：
1. /rpc节点服务端(neo-cli)
2. 区块数据服务端(neon-wallet-db)
3. neon-js

他们之间的关系用一张图来表达就是：

![neon体系架构](/assets/images/201803/neon-flow.png)

其中黄色部分为底层节点以及接口，绿色部分为定期从``/rpc``更新数据的缓存接口，粉色部分就是轻钱包客户端，自身不保存区块数据，实则保存在缓存接口中。

至于如何进行轻钱包开发，也就是用轻钱包做到交易转账、合约调用这些有实际意义的事情，还有很多篇幅可以讲 : )