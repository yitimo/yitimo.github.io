---
layout: post
title:  个人理解NEO中的合约交易
date:   2018-03-02 15:12:23 +0800
author: yitimo
categories: jekyll update
tags: ["blockchain", "NEO", "SmartContract"]
keywords:
- blockchain,
- NEO,
- SmartContract,
description: Personal thought on kinds of transactions in NEO.
---

本文将使用一个简单的web客户端，配合``neon-js``完成多系列交易（transaction）操作，说白也就是手动实现两种交易类型——InvocationTransaction和ContractTransaction。以此来帮助理解NEO中的用户、智能合约以及两者的交互。

本文将完成以下操作：

1. 用户给用户转账
2. 用户给普通``NEP-5智能合约``转账，并调用``mintTokens``方法取出代币，也就是参与一次ico操作
3. 简单智能合约给用户转账(深坑)

本文准备的项目为一个简单的web项目，基于``angular``，各种钱包操作通过调用``neon-js``实现。(实际上[CityOfZion](https://github.com/CityOfZion)的``neon-wallet``轻钱包就是这么个东西)

## neon-js 提供的接口

浏览``neon-js``源码大致能找到其提供的几类接口：
``` typescript
// 这算是个别名，用它能实现很多底层操作
import Neon from '@cityofzion/neon-js';
// tx包含了交易相关接口
// wallet包含了钱包相关接口
// api包含了一些通用接口
// rpc包含了有关rpc接口的接口(rpc接口为远程的neo-cli项目提供的接口)
import {tx, wallet, api, rpc} from '@cityofzion/neon-js';
```

## Transaction类

``Transaction``类可以说是``neon-js``中最核心的一个类了，正如``sendrawtransaction``接口是``/rpc``接口中最有用的接口，这个``Transaction``类实例化的对象就是最终用来请求这个rpc接口进而产生新区快的东西，没错，就是``utxo``。

``Transaction``中有两个静态方法可以用来很方便的创建一个utxo，分别是``createInvocationTx``和``createContractTx``，只看字面也能知道，前者是用来创建一个带有合约调用的交易，后者则只有交易没有合约调用。

显然，接下来要完成的三个操作中，用户给用户转账就调用``createContractTx``来创建utxo，用户参与ico就调用``createInvocationTx``，至于鉴权合约，比较特殊，会单独讲，再次强调这是个深坑。

## 完成用户给用户转账

*题外话：用angular项目作为轻钱包客户端有一个天然优势，就是支持TypeScript，强大的代码提示节省了不少精力。*

创建一个转账交易，然后签名并广播这个交易的代码如下：

```typescript
// 创建utxo
let utxo = tx.Transaction.createContractTx(
    this.balance, // 谁转账填谁的余额
    api.makeIntent({NEO: 1}, '目标地址'), // 转到谁的地址多少钱
    null // 忽略这个参数
);
// 对utxo签名 花谁的钱就要签谁的名
utxo = (utxo as any).sign('这里填转账人的私钥');
// 发送这个utxo
rpc.Query.sendRawTransaction(utxo).execute(this.rpcUrl).then((res) => {
    console.log(res);
}).catch((err) => {
    console.log(err);
});
```

其中有两个参数需要额外获取，也就是``this.balance``和``this.rpcUrl``，在ngOninit()中先获取到：

``` typescript
ngOnInit() {
    // 传入地址获取改地址的余额，用于后续计算交易的输入
    api.neonDB.getBalance('TestNet', this.owner).then((res: wallet.Balance) => {
        this.balance = res;
        console.log(JSON.stringify(res.assets['NEO']));
    });
    // 获取测试网的rpc接口地址
    api.neonDB.getRPCEndpoint('TestNet').then((url) => {
        this.rpcUrl = url;
    }).catch((err) => {
        console.log(err);
    });
}
```

执行前面一段代码顺利的话转账就完成了，前提是余额中要有足够的NEO。此过程值得注意的是签名前后的交易有何不同：

![签名前后的交易](/assets/images/201803/sign-result.png)

可以看到签名后``scripts``字段多了一项，这就是用发送者的私钥添加上的见证人脚本。实际上本次交易中涉及到多少方的input就需要逐个加上其见证人脚本。

除此之外我们还可以看看一个utxo究竟长啥样，看到包含了type、inputs、outputs、scripts等字段。其中``type``为128指示这是个转账交易，``inputs``包含了本次交易的输入的utxo，``outputs``包含了本次交易都有什么资产(assetId)转到了哪里(scriptHash)多少钱(value)，``scripts``也就是签名了。

## 合约调用交易

至于合约调用交易参数略有不同：

``` typescript
let newTx = tx.Transaction.createInvocationTx(
    this.balance, // 用户的余额
    api.makeIntent({NEO: 1}, wallet.getAddressFromScriptHash('代币的脚本哈希去掉最前面的0x')), // 转1NEO到代币的地址
    {operation: 'mintTokens', scriptHash: '合约的脚本哈希去掉最前面的0x'}, // 合约mintTokens以获取代币
    0, null // gas消耗以及重写参数 直接忽略
);
```

只要调用的智能合约本身没问题，一切都会很顺利，顺便看看这种情况下的utxo长什么样：

![合约调用交易](/assets/images/201803/invoke-transaction.png)

其中别的同意都一样，输入是余额中取出来的utxo，输出是转1NEO到合约地址，以剩下的的钱找零回自己的地址，同时还有自己的签名。

不一样之处就是``type``变为了209，并且多了一个``script``字段，包含了本次合约调用参数的hash。

也就是说，这个交易，在转账的同时调用了一下mintTokens方法。

## 合约给地址转账

首先明白只要转账就必须要签名，跟购物刷卡一样。

然后明白签名就要签自己的名，还是跟刷银行卡一样。

接下来要明白其实普通用户账户也是个智能合约，也有自己的脚本哈希，区别是用户账户还有个私钥，而智能合约账户只有自己的脚本代码。而就是说，智能合约转账会触发其中的鉴权合约逻辑，而用户转账其实也会触发自己的鉴权合约逻辑，必须有自己的签名才会通过。

那么现在问题来了，智能合约想要给用户转账的话，也必须要签名，而且得签自己的名，用户签名用的是自己的私钥，那么智能合约怎么签名？

答案是用智能合约的脚本，也就是``neo-gui``中加载avm文件后读出来的那一长串字符。

现在要转过来说说一个智能合约是如何工作的(非源码层面，仅关注其代码逻辑)，先看下面这段只能合约代码：

``` typescript
public class YitimoA: SmartContract
{
    public static readonly byte[] Owner = "AaHEnwbT15CYHaWYyfbmAxWWaGT3Zzvk3B".ToScriptHash();

    public static Object Main(string operation, params object[] args)
    {
        if (Runtime.Trigger == TriggerType.Verification)
        {
            if (Runtime.CheckWitness(Owner))
            {
                return true;
            }
            // 这里面不要PutStorage但是可以Get
            // 检查是否匹配上一个存入的数据
            var lastcall = Storage.Get(Storage.CurrentContext, "lastcall").AsString();
            if (operation == lastcall)
            {
                return true;
            }
            return false;
        }
        else if (Runtime.Trigger == TriggerType.Application)
        {
            if (operation == "call") // 不管谁来执行这个都爆炸 连false都不返回
            {
                if (Runtime.CheckWitness(Owner))
                {
                    Storage.Put(Storage.CurrentContext, "lastcall", (byte[])args[0]);
                    return "done";
                }
                return "notyitimo";
            }
            else if (operation == "goahead")
            {
                Storage.Put(Storage.CurrentContext, "lastcall", (byte[])args[0]);
                return "done";
            }
            else if (operation == "check")
            {
                return Storage.Get(Storage.CurrentContext, "lastcall").AsString();
            }
        }
        return "unknownmethod";
    }
}
```

其中``if (Runtime.Trigger == TriggerType.Verification)``用来区分这是个鉴权合约还是个调用合约，也就是说，是从合约中转钱出去呢，还是只是调用合约的方法。用流程图来表示这段代码如下：

![四种执行情况](/assets/images/201803/code-flow.png)

重难点如下：

* 从谁转钱出去就触发谁的鉴权合约
* 鉴权合约也可以传入参数，传入的参数与合约调用时传入的参数不同，是放在scripts字段中的，也就是是见证人脚本的一部分。而合约方法调用的参数则是放在script字段中。也就是说是两条完全不同的流程，虽然代码在一起。
* 应用合约逻辑中有CheckWitness可以检查调用者地址，但是鉴权合约中的CheckWitness是检查合约本身地址的(类比普通用户的鉴权合约，也是鉴的用户自己)。也就是说，见证人是管理员的情况下从合约中取钱，一样无法通过鉴权合约中的CheckWitness，因为只有合约自己通的过。

理解了这一些，就应该能明白上面这段合约代码是干什么的，也就是：

* 通过调用合约设置一个密码，从合约中转钱出来时则必须匹配这个密码。
* 只有管理员能调用call方法来设置密码
* 所有人都能调用goahead方法来设置密码

本文应该还能回答一个问题，一个笔者找遍全世界找不到答案的问题——参与ico用NEO换代币这个操作可以说是很简单了，但是ico进去的NEO到底怎么取出来呢？
