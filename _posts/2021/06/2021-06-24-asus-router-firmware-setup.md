---
layout: post
title: 华硕路由器 AX88U 刷梅林改固件
date: 2021-06-24 11:7:12 +0800
author: yitimo
categories: network
tags: ["network"]
keywords:
- router,
description: ASUS router firmware setup.
---

此为基于自己的 ``AX88U`` 路由器刷上梅林改固件后的一个备忘总结。

- wire the router
- set as an aimesh node
- disable smart connect
- set different SSIDs
- fixed channels

## 固件升级

迫于koolshare论坛于本月提高了其一些固件帖子的可阅读权限, 用户必须拿到50积分才能阅读, 而笔者的万年潜水账号只有可怜的1分, 上传头像后分数终于高达3分, 预计还需要每日签到至一个半月后才有浏览资格:(
而笔者的需求其实并不高, 仅为下载到一个不需要最新的固件离线包, 然后给路由器刷上跑起来即可. 对于同样需求的人可以按以下几步完成:

1. 到 [KoolShare固件下载服务器](https://firmware.koolshare.cn/)找到自己需要的包, 比如笔者的 AX88U 就是: [https://firmware.koolshare.cn/Koolshare_RMerl_New_Gen_386/RT-AX88U/](https://firmware.koolshare.cn/Koolshare_RMerl_New_Gen_386/RT-AX88U/)
2. 在自己的路由器后台 ``固件升级`` 里上传下载到的 ``.w`` 文件, 然后路由器会自动重启
3. 在 ``系统管理 > 系统设置`` 内勾选 ``Format JFFS partition at next boot`` 和 ``Enable JFFS custom scripts and configs`` > 点击应用本页面设置 > 成功后重启路由器

### 一些注意事项

- 以上仅为官方固件刷梅林改的方式
- 本文使用到的工具、技术仍基于并来自 [koolshare社区](https://koolshare.cn/forum-96-1.html)
- 如固件下载服务器里提到的, 此方式只能下载到除了最新版的旧版固件, 对于 ``想刷最新版 && (非社交恐惧 || 有耐心签到)`` 的人士, 还是得移步论坛
- 实测忘记做第3步, 新固件也已经可用了, 应该是新版**默认开启**了
- 刷到新固件后恢复出厂还会是新的固件, 但软件需要重新装, JFFS 开关需要手动开

## 概念梳理

> 大量梳理自wiki

- **频段**: 也就是常用的 2.4G/5G 这俩所属的概念, 可看作1级分类. 字面意思为一个 ``频率片段``, 如 2400MHz~2500MHz 这个频段是 2.4G 频段, 整体频宽为 ``100Mhz``
- **频道**: 也有叫信道, 可看作2级分类. 如 2.4G 频段下, 取13个点作为13个频道, 现有标准下每个频道间隔了5MHz
- **频宽**: 也就是带宽, 频率宽度. 如 ``2.4G频段`` 下的 ``1信道(频率2412MHz)``, 设频宽为 ``20M``, 则该信道就包含了 ``2402M~2422M`` 这个频段. ``wifi4`` 开始支持 ``40MHz`` 的频宽, 但2.4G总量还是那100MHz的总频宽, 故只有从 ``3信道(频率2422MHz)`` 开始可用了, 包含 ``2402MHz~2442MHz`` 这个频段, 且更容易与后续几个信道重叠导致干扰, 好处是带宽增加能使最终网速(成倍)提升
- **频率**: 当作单位来用, 单位时间内完成周期性变化的次数, 一般用 MHz/GHz
- **SSID**: 无线网络标识, 多个AP可以拥有同一个ESSID(也就是wifi名称), 但各自的BSSID唯一(是数据链路层的MAC地址)
- **调制/解调**: 无线/有线信号(Hz)跟数据传输速度(比特率 bit/s)的相互转换, 即以上都是在讲频率数值, 而最终使用的是俗称的网速, 有一个 ``调制/解调`` 过程, 本文不展开, 效果就是各种**频宽(带宽)**通过各种**调制编码方案**能提供各种**上下行网速**
- **固件**: 类比成PC的操作系统(严格来说是BIOS), 是一种嵌入在硬件设备中的软件
- **软件中心**: 支持安装各种功能的插件到路由器里, 而官方固件不支持. KoolShare自带了一些, 也可以自行开发.
- **Wi-Fi**: 一个基于IEEE 802.11标准的无线局域网技术.
- **网线**: TODO: 整理双绞线、同轴电缆、光纤


> 常规家庭里可能是这个情况: 路由器在2个确定的频道上发射wifi信号, 其中一个的频率属于2.4G频段的范围内, 另一个属于5G频段的范围内
> 例如华硕AX88U支持的无线
> 终端设备(手机、电脑、智能家居设备等)会搜寻自己支持的频率, 然后加入到需要加入的SSID

---

TODO: 更多待补充

## 相关链接

- [KoolShare交流社区](https://koolshare.cn/forum-96-1.html)
- [神秘软件](https://github.com/hq450/fancyss)