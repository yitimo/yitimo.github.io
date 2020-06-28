---
layout: post
title: Docker node alpine 容器内支持中文字体
date: 2020-06-28 20:23:12 +0800
author: yitimo
categories: nodejs
tags: ["nodejs", "docker"]
keywords:
- nodejs,
- docker,
description: Chinese support in docker node alpine.
---

笔者在开发基于eggjs的nodejs服务时, 选择将其容器化部署, 对于开发流程来说和常规部署没有区别, 直到遇到新需求——需要在服务端动态绘制图片返回给前端使用。

当绘图内容涉及中文汉字时, 本地调试是一切正常的, 因为常规PC一般都支持了大部分语言字体, 但当将其部署到docker时, 发现中文都变成了方框。才想起用的是node-alpine镜像, 自然不会自带中文字体。

## 下载字体文件

以宋体为例, 随便一搜下载到字体文件 ``simsun.ttf``, 大小为10M.

> TODO: 扩展-ttf和ttc的区别

> TODO: 扩展-emoji表情支持

## 微调Dockerfile

- 笔者用的图片绘制库是 ``sharp``
- 设置国内镜像节省光阴(sharp@0.25.4开始对国内镜像的支持也更好了)
- 镜像内分阶段构建 第一阶段处理npm依赖 第二阶段实际部署
- 注意在第二阶段才复制字体文件到系统路径下

``` Dockerfile
# 第一阶段构建
FROM node:12.13.1-alpine as builder

ENV NODE_ENV=development EGG_SERVER_ENV=local
ENV npm_config_sharp_binary_host="https://npm.taobao.org/mirrors/sharp"
ENV npm_config_sharp_libvips_binary_host "https://npm.taobao.org/mirrors/sharp-libvips"

# 代码目录
WORKDIR /usr/src/app
# 依赖相关
COPY package*.json ./
# 安装依赖 使用淘宝镜像
RUN npm ci --only=production --registry=https://registry.npm.taobao.org --unsafe-perm
# 将代码复制进容器
COPY . .

# 第二阶段构建
FROM node:12.13.1-alpine
ENV NODE_ENV=development EGG_SERVER_ENV=local

WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .

# 使用字体文件(中文宋体)
RUN mkdir -p /usr/share/fonts/win
RUN mv fonts/simsun.ttf /usr/share/fonts/win/simsun.ttf

# 启动
EXPOSE 7001
CMD [ "npm", "run", "start" ]
```

## 参考

有文章提到需要安装一些依赖, 但实测不这么做也可以:

``` sh
apk add font-adobe-100dpi fontconfig # fc-list等命令找不到就是因为需要安装 fontconfig 依赖
```

- [https://blog.csdn.net/zimou5581/article/details/101368129](https://blog.csdn.net/zimou5581/article/details/101368129)
- [https://github.com/lovell/sharp/issues/1875](https://github.com/lovell/sharp/issues/1875)
