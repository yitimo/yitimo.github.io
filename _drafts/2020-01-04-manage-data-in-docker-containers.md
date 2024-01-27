---
layout: post
title:  【翻译】管理Docker容器的数据
date:   2024-01-27 15:46:12 +0800
author: yitimo
categories: docker
tags: ["docker", "translation"]
keywords:
- docker,
- translation,
description: Translation for <Manage data in containers>.
---

> 原文链接：[Manage data in Docker](https://docs.docker.com/storage/)

默认情况下容器内创建的所有文件都被存储在一个可写的容器层内, 这意味着:

- 当容器不再存在时数据也不能保持, 并且容器外的其他进程将很难访问到这些数据.
- 容器可写层是与容器运行的宿主机环境紧密藕和的. 你不能很轻松的将数据移动到别处去.
- 写入数据到容器可写层需要一个[存储驱动器]()来管理文件系统. 其使用linux内核提供了一个联合的文件系统. 这一额外的抽象层相比使用数据卷性能要差, 后者能直接写入文件到宿主文件系统里.

Docker有两个可选配置来保证即使容器停止了, 文件也能持久存储在宿主机上: 卷(volumes) 和 绑定挂载(bind mounts).

同时Docker还支持容器将文件存储在宿主机内存里. 这些文件不是持久化存储的. 如果你在 linux 上运行 Docker, 会使用 ``tmpfs`` 挂载来保存文件到宿主机内存里. Windows下则用的是命名管道(named pipe).

## 选择正确的挂载方式

无论你选择用那种方式来挂载文件, 对容器来说数据都是相同的. 最终都是暴露为

![type of mounts](/assets/images/202401/types-of-mounts.webp)

### 数据卷

### 绑定挂载

### tmpfs

### 命名管道

## 适合用数据卷的情况

## 适合用绑定挂载的情况

## 适合用 tmpfs 挂载的情况

## 使用绑定挂载或数据卷时的提示

## 下一步
