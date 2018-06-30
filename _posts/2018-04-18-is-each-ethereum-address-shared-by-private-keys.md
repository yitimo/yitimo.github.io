---
layout: post
title:  是否可能两个ETH私钥对应同一个地址
date:   2018-04-18 18:16:13 +0800
author: yitimo
categories: jekyll update
tags: ["blockchain", "crypto"]
keywords:
- blockchain,
- crypto,
description: Is each Ethereum address shared by (theoretically) 2 ** 96 private keys? This is a question in StackExchange.
---

原提问[在这里](https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys)。

笔者在使用到``neon-js``中的私钥生成方法时发现其使用了[getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)方法来生成64字符长度的私钥，进而考虑到其随机性，若是调用足够多次，依然有可能生成两个完全一样的私钥，这也就是在暴力破解区块链中的账户了。然后就找到了最前面的这个提问，对其整理翻译得到此文。

## 概述
在以太坊中，一个私钥长度为256位(64字符，32字节)，而从私钥得到的地址长度位160位(40字符，20字节)。依据"Pigeonhole Principle"(一句话概括就是10个大师球抓11只皮卡丘的话至少有一个大师球得装两只皮卡丘)，当私钥总数足够多时必然会有相同私钥出现。所以理论上来说，共有2\*\*256个私钥对应2\*\*160个ETH地址，那么就至少有2\*\*96个私钥对应的地址会重复，也就是这么多只皮卡丘得和另外2\*\*160只共享大师球了。(相对的公钥长度则为512位，与私钥的对应就溢出了许多，不过在NEO中公钥长度与私钥一致，所以最极端情况下可以刚好一一对应)

## 问题
如果两个私钥指向的是同一个地址，那他俩是否都有对此地址的所有权，是否都能操作这一地址的转账(签名)？更夸张的设想，如果连私钥都重复生成了，那岂不是一笔可能存在的巨款可以被共享了？

## 被采纳回答

并不是完全有 2\*\*256个私钥能被生成(看来私钥碰撞的难度降低了)。而是``FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFE BAAEDCE6 AF48A03B BFD25E8C D0364141``个。这一数值在ETH源码中被定义为``N``，是ETH密钥对生成使用的secp256k1椭圆曲线的依照。
回到你的问题，确实，对应同一地址的私钥都能够花费这个地址中的余额，并依照先到先服务进行。他们将会生成同一个公钥，这是椭圆曲线数字签名算法想要避免的，并且，两者生成的签名也同时对这个地址有效。在[go-ethereum/accounts/key.go](https://github.com/ethereum/go-ethereum/blob/fed692f67e81bd3937a5efab38f56a9b99d04d41/accounts/key.go)中我们从S256(secp256k1的曲线)生成一个私钥，这意味着私钥的值默认会小于``N``。

```
func newKeyFromECDSA(privateKeyECDSA *ecdsa.PrivateKey) *Key {
    id := uuid.NewRandom()
    key := &Key{
        Id:         id,
        Address:    crypto.PubkeyToAddress(privateKeyECDSA.PublicKey),
        PrivateKey: privateKeyECDSA,
    }
    return key
}

func newKey(rand io.Reader) (*Key, error) {
    privateKeyECDSA, err := ecdsa.GenerateKey(secp256k1.S256(), rand)
    if err != nil {
        return nil, err
    }
    return newKeyFromECDSA(privateKeyECDSA), nil
}
```

[go-ethereum/crypto/secp256k1/secp256](https://github.com/ethereum/go-ethereum/blob/fed692f67e81bd3937a5efab38f56a9b99d04d41/crypto/secp256k1/secp256.go)中也使用了稍微不同的方法生成密钥对。

### 对于这个N究竟意味着什么的很酷的解释

想象私钥是你的车子的车速，而公钥是你的车子的仪表盘，而仪表盘最多显示``000,000``到``999,999``，那如果实际车速为``1,000,001``时仪表盘显示速度就会是1，也就是两个速度与一个显示(两个私钥与一个地址)。

椭圆曲线的组算法与这颇为相似，只不过不是``999,999``而是看起来很随意的这个``N``。由于这个原因，就算你有了不同的私钥，你也有可能创建同一公钥的合法的签名并因此花费同一ETH地址的余额。

### 较枯燥的数学解释

私钥是个256位数值，为了从一个私钥计算出公钥，将它与一个椭圆曲线组(``g``)相乘，在ETH中这个值是定义在secp256k1库中的一个变量，它本身也是一个椭圆曲线点，由于椭圆曲线本身是循环的，所以存在一个``n``使得``n.g = 1``，这被称作``generator order``。

根据这一方程我们可以知道，如果我们有一个私钥``k``，k大于n，我们将有``k.g = (k-1).g = k'.g``，这个``k'``就是另一个私钥了，所以我们的私钥必须小于``n``，而不是``2\*\*256``。

另外两个你可能有兴趣的问题：

* [提问1](https://ethereum.stackexchange.com/questions/217/what-if-i-had-the-private-key-that-had-the-public-address-of-a-contract)
* [提问2](https://ethereum.stackexchange.com/questions/8197/are-addresses-between-different-networks-testnet-interchangeable)

## 个人总结

生成重复私钥和生成对应同一地址的私钥是两个问题，后者可以通过限制私钥生成范围来避免，但前者反而会因为了避免后者而增加发生几率(从``1/2\*\*256``增加到``1/某个限制值``)。

从这个提问来看，至少``go-ethereum``中通过限制私钥生成的范围来保证不会有两个私钥对应同一公钥，也就是不超出椭圆曲线的周期范围(仍不能避免理论上生成两个相同私钥的可能)。
不过，仍然可能存在某次生成新私钥时这个私钥是全网中曾经生成过的，这虽然难度很高，但耐不住区块链完全公开，完全可能有比较无聊又恶趣味的人不停碰撞私钥。虽然说这个私钥机制被推翻的那天密码学跟区块链必然都会有较大冲击，但至少目前这事情也只是理论上可行。

深入目前最新的``go-ethereum``源码，在[]()中可以看到私钥是这么创建的：

```
privateKeyECDSA, err := ecdsa.GenerateKey(crypto.S256(), reader)
```

也就是调用了``crypto/ecdsa``库的``GenerateKey``方法，给的范围是``crypto.S256()``，这个值在[curve.go](https://github.com/ethereum/go-ethereum/blob/master/crypto/secp256k1/curve.go)中可以找到：

```
var theCurve = new(BitCurve)

func init() {
	// See SEC 2 section 2.7.1
	// curve parameters taken from:
	// http://www.secg.org/collateral/sec2_final.pdf
	theCurve.P = math.MustParseBig256("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F")
	theCurve.N = math.MustParseBig256("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141")
	theCurve.B = math.MustParseBig256("0x0000000000000000000000000000000000000000000000000000000000000007")
	theCurve.Gx = math.MustParseBig256("0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798")
	theCurve.Gy = math.MustParseBig256("0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8")
	theCurve.BitSize = 256
}

// S256 returns a BitCurve which implements secp256k1.
func S256() *BitCurve {
	return theCurve
}
```

并在[crypto.go](https://github.com/ethereum/go-ethereum/blob/master/crypto/crypto.go)中定义了如下变量用于限制范围，超过此范围的就视为非法私钥：

```
var (
	secp256k1_N, _  = new(big.Int).SetString("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16)
	secp256k1_halfN = new(big.Int).Div(secp256k1_N, big.NewInt(2))
)
```

不过回到笔者一开始的目的，使用``neon-js``中的私钥生成方法来创建一个NEO私钥，这货直接使用的是js中的``encrypt.getRandomValues``，其随机性以及对双重私钥(对应同一地址)的防御能力又有多少呢？答案看来得去追踪``NEO-CLI``自己的私钥生成算法了。如果没找错的话是[下面这段](https://github.com/neo-project/neo/blob/master/neo/Wallets/Wallet.cs)：

```
public WalletAccount CreateAccount()
{
    byte[] privateKey = new byte[32];
    using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
    {
        rng.GetBytes(privateKey);
    }
    WalletAccount account = CreateAccount(privateKey);
    Array.Clear(privateKey, 0, privateKey.Length);
    return account;
}
```

仅通过C#自带的库生成，没找到范围限制，也就是跟``neon-js``的做法一样，把随机程度压力交给大佬了，这样来看不知是好消息还是坏消息，可以放心使用``neon-js``来创建私钥了，反正没比``neo``核心的创建方法差到哪里去。

再提出个大胆的想法，如果集齐一万甚至更多的志愿者，每天也不挖矿，每人整个超级计算机就碰撞某个范围的ETH私钥(可以看作是难度巨大的挖矿)，协商如果谁遇到了巨额存款地址就平摊，哲学角度这就是在挑战区块链核心的信仰了。
