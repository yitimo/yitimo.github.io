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

比如直接获取NEO主网的创世区块得到的两种结果如下：

```
000000000000000000000000000000000000000000000000000000000000000000000000f41bc036e39b0d6b0579c851c6fde83af802fa4e57bec0bc3365eae3abf43f8065fc8857000000001dac2b7c0000000059e75d652b5d3827bf04c165bbe9ef95cca4bf55010001510400001dac2b7c00000000400000455b7b226c616e67223a227a682d434e222c226e616d65223a22e5b08fe89a81e882a1227d2c7b226c616e67223a22656e222c226e616d65223a22416e745368617265227d5d0000c16ff28623000000da1745e9b549bd0bfa1a569971c77eba30cd5a4b00000000400001445b7b226c616e67223a227a682d434e222c226e616d65223a22e5b08fe89a81e5b881227d2c7b226c616e67223a22656e222c226e616d65223a22416e74436f696e227d5d0000c16ff286230008009f7fd096d37ed2c0e3f7f0cfc924beef4ffceb680000000001000000019b7cffdaa674beae0f930ebe6085af9093e5fe56b34a5c220ccdcf6efc336fc50000c16ff28623005fa99d93303775fe50ca119c327759313eccfa1c01000151
```

```
{
    "hash": "0xd42561e3d30e15be6400b6df2f328e02d2bf6354c41dce433bc57687c82144bf",
    "size": 401,
    "version": 0,
    "previousblockhash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "merkleroot": "0x803ff4abe3ea6533bcc0be574efa02f83ae8fdc651c879056b0d9be336c01bf4",
    "time": 1468595301,
    "index": 0,
    "nonce": "000000007c2bac1d",
    "nextconsensus": "APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR",
    "script": { "invocation": "", "verification": "51" },
    "tx": [
        {
            "txid": "0xfb5bd72b2d6792d75dc2f1084ffa9e9f70ca85543c717a6b13d9959b452a57d6",
            "size": 10, "type": "MinerTransaction",
            "version": 0, "attributes": [], "vin": [], "vout": [],
            "sys_fee": "0", "net_fee": "0", "scripts": [], "nonce": 2083236893
        },
        {
            "txid": "0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
            "size": 107,
            "type": "RegisterTransaction",
            "version": 0, "attributes": [], "vin": [], "vout": [], "sys_fee": "0", "net_fee": "0", "scripts": [],
            "asset": {
                "type": "GoverningToken",
                "name": [
                    {
                        "lang": "zh-CN",
                        "name": "小蚁股"
                    },
                    {
                        "lang": "en",
                        "name": "AntShare"
                    }
                ],
                "amount": "100000000",
                "precision": 0,
                "owner": "00",
                "admin": "Abf2qMs1pzQb8kYk9RuxtUb9jtRKJVuBJt"
            }
        },
        {
            "txid": "0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7",
            "size": 106,
            "type": "RegisterTransaction",
            "version": 0, "attributes": [], "vin": [], "vout": [], "sys_fee": "0", "net_fee": "0", "scripts": [],
            "asset": {
                "type": "UtilityToken",
                "name": [
                    {
                        "lang": "zh-CN",
                        "name": "小蚁币"
                    },
                    {
                        "lang": "en",
                        "name": "AntCoin"
                    }
                ],
                "amount": "100000000",
                "precision": 8,
                "owner": "00",
                "admin": "AWKECj9RD8rS8RPcpCgYVjk1DeYyHwxZm3"
            }
        },
        {
            "txid": "0x3631f66024ca6f5b033d7e0809eb993443374830025af904fb51b0334f127cda",
            "size": 69, "type": "IssueTransaction", "version": 0, "attributes": [], "vin": [],
            "vout": [
                {
                    "n": 0,
                    "asset": "0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
                    "value": "100000000",
                    "address": "AQVh2pG732YvtNaxEGkQUei3YA4cvo7d2i"
                }
            ],
            "sys_fee": "0", "net_fee": "0",
            "scripts": [ { "invocation": "", "verification": "51" } ]
        }
    ],
    "confirmations": 2598067,
    "nextblockhash": "0xd782db8a38b0eea0d7394e0f007c61c71798867578c77c387c08113903946cc9"
}
```

这两个结果包含的数据是一样的，可以互相序列化与反序列化。区块数据库中保存的是序列化后的结果。

*待完成。。。*


