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

## 固件升级

迫于koolshare论坛于本月提高了其一些固件帖子的可阅读权限, 用户必须拿到50积分才能阅读, 而笔者的万年潜水账号只有可怜的1分, 上传头像后分数终于高达3分, 预计还需要每日签到至一个半月后才有浏览资格:(
而笔者的需求其实并不高, 仅为下载到一个不需要最新的固件离线包, 然后给路由器刷上跑起来即可. 对于同样需求的人可以按以下几步完成:

1. 到 [KoolShare固件下载服务器](https://firmware.koolshare.cn/)找到自己需要的包, 比如笔者的 AX88U 就是: [https://firmware.koolshare.cn/Koolshare_RMerl_New_Gen_386/RT-AX88U/](https://firmware.koolshare.cn/Koolshare_RMerl_New_Gen_386/RT-AX88U/)
2. 在自己的路由器后台 ``固件升级`` 里上传下载到的 ``.w`` 文件, 然后路由器会自动重启
3. 在 ``系统管理 > 系统设置`` 内勾选 ``Format JFFS partition at next boot`` 和 ``Enable JFFS custom scripts and configs`` > 点击应用本页面设置 > 成功后重启路由器

**一些注意事项**

- 以上仅为官方固件刷梅林改的方式
- 如固件下载服务器里提到的, 此方式只能下载到除了最新版的旧版固件, 对于 想刷最新版 && (非社交恐惧 || 有耐心签到) 的人士, 还是得移步论坛
- 实测忘记做第3步, 新固件也已经可用了

## 概念梳理

*待补充*

**固件**

**软件中心**

## 相关链接

- [KoolShare交流社区](https://koolshare.cn/forum-96-1.html)
- [神秘软件](https://github.com/hq450/fancyss)
