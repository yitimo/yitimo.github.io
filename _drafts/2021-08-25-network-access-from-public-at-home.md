---
layout: post
title: 家庭宽带下原生实现外网访问
date: 2021-08-25 20:18:12 +0800
author: yitimo
categories: deploy
tags: ["network", "opt"]
keywords:
- opt,
- network,
description: Network access from public at home.
---

家庭宽带下原生的内网穿透大概要解决这些问题:

### 公网ip经常变

每次宽带PPPoE拨号分配到的IP一般都不同, 这就导致无法通过固定的IP地址访问到家庭网关。

而使用DDNS服务后就支持:

1. 在网关路由器上运行DDNS客户端, 定时请求服务器汇报自己当前的IP
2. 在DDNS服务提供商后台进行配置, 当IP变化时更新域名解析
3. 始终访问配置了DDNS的域名, 再由域名访问到当前指向的IP地址

### 安装nginx

下一步就可以在路由器上放一个简单的静态网页, 然后安装nginx来提供服务了, 不过要注意DDoS等攻击 :)

TODO: 以华硕梅林改固件为例实现安装软件中心和nginx

### 被封印的 80/443 端口

在完成上文提到的事情后, 我们拥有了一个指向家里的域名, 并通过nginx托管了一个网页, 比如: ``domain/index.html``, 但结果是没办法访问 ``http://domain/index.html``或``https://domain/index.html``来打开网页。

原因就是家庭宽带下 80/443 端口被封印了。如果在nginx.conf里修改监听的端口为 80/443 之外的端口, 网页就能正常访问, 比如: ``http://domain:10086/index.html``。

此时就不得不通过一台真正的云服务器做转发了, 云服务器拥有固定的公网IP, 并开放了 80/443 端口, 缺点是同带宽配置下会贵很多。

## 实战

下面将实战通过外网远程桌面连接到家里的PC。

涉及的事务包括:

1. 一台放在家里的PC
2. 网关路由器
3. 一台放在公司的笔记本

TODO: 待补充...
