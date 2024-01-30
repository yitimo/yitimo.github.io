---
layout: post
title: 使用 Verdaccio 搭建 npm 私库
date: 2024-01-30 18:30:12 +0800
author: yitimo
categories: frontend
tags: ["frontend"]
keywords:
- frontend
description: Build npm private registry with Verdaccio.
---

本文将介绍如何基于 Verdaccio 搭建私有化的 npm 仓库, 并支持投入到生产使用.

## 环境准备和运行

### 安装 nvm 和 nodejs

使用 nvm 可以更方便的切换多个 nodejs 版本, 且不会污染系统环境. 参照其[github页面](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)可以这样安装:

``` sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

其中版本号可以自行替换为最新版本.

TODO: ...

### 安装 verdaccio 和 pm2

### 运行

## 常用配置

### uplinks

## 实际使用

### 发布一个私包到私库

### 安装私包过程

## 私库维护

### 权限

### 版本升级

### 缓存和备份

## 扩展阅读
