---
layout: post
title:  管理员如何从ICO合约中取出NEO
date:   2018-03-26 15:12:23 +0800
author: yitimo
categories: BlockChain
tags: ["blockchain", "NEO"]
keywords:
- blockchain,
- NEO,
- Smart Contract,
description: After users participate into an ICO, how can the contract admin withdraw the assets(user sent in).
---

本文将完成一件似乎被全世界NEO开发相关资源无视的事情，事情很简单，就是管理员如何从自己的ICO合约中取出别人贡献的资产，这里直接将资产视为``NEO``。下文的所有资产相关操作都直接视为NEO。

笔者曾找遍全网，尽是什么如何参与ICO的，如何提现token的，最走火入魔的是自己加了个合约方法把资产转给其他用户的(说白还是变相在走密码合约而跳过了鉴权合约)。

NEO的转账说白了很简单，无非就是需要转账人签名，签名需要用到转账人的私钥，不过对于合约的NEO转账就不一样了，因为合约没有私钥这个概念，签名用的就是合约脚本本身，而一个签名包含两个字段——校验脚本和调用脚本，对合约来说校验脚本就是合约的脚本本身，调用脚本为参数，对于鉴权合约而言这个参数没有意义，随便乱传即可，如果是密码合约，则可以在合约代码中对比这个参数跟密码。下面用几段代码来详细说明。

## 密码合约

*待完成。。。*
