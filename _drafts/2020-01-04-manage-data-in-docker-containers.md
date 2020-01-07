---
layout: post
title:  【翻译】管理Docker容器的数据
date:   2020-01-04 10:20:12 +0800
author: yitimo
categories: docker
tags: ["docker", "translation"]
keywords:
- docker,
- translation,
description: Translation for <Manage data in containers>.
---

> 原文链接：[Manage data in containers](https://docs.docker.com/v17.03/engine/tutorials/dockervolumes/)

本文将学习如何管理容器内以及容器之间的数据。你将看到两种基本方式来管理Docker引擎的数据:

- 数据卷(Data volumes)
- 数据卷容器(Data volume containers)

## 数据卷(Data volumes)

数据卷是特殊指定的目录，包含了一个或多个绕过Union File System的容器。数据卷提供了一些有用的特性来持久化存储或共享数据:

- 在容器创建时初始化卷。如果容器基于的镜像包含了指定挂载点的数据，这些数据会在初始化卷时被复制进去。(注意: 当挂载宿主机目录时不会这样)
- 
