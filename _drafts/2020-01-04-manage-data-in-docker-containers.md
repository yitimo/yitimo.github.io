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

无论你选择用那种方式来挂载文件, 对容器来说数据都是相同的. 最终都是暴露为容器文件系统里的一个目录或文件.

一个简单的形容数据卷、绑定挂载和tmpfs挂载区别的方式是想象数据如何在Docker宿主里存在.

![type of mounts](/assets/images/202401/types-of-mounts.webp)

- 数据卷保存在由Docker管理的宿主文件系统的一部分里(linux里是``/var/lib/docker/volumes/``). 非Docker进程不应该修改文件系统里的一部分. 数据卷是Docker里最好的存储数据的方式.
- 绑定挂载可能被存储在宿主系统的任意位置. 他们可能是很重要的系统文件或目录. 宿主机上的非Docker进程或者Docker容器自己都能任意修改它们.
- tmpfs挂在只会保存在宿主机的内存里, 永远都不会被写进宿主机文件系统里.

绑定挂载合数据卷都能用 ``-v`` 或 ``--volume`` 标识挂在到容器里, 但是有略微不同. 而对于tmpfs挂载, 你可以使用 ``--tmpfs`` 标识. 我们推荐容器和服务都用 ``--mount`` 来使用绑定挂载, 数据卷, 或者 tmpfs 挂载, 这样语法更加清晰.

### 数据卷

数据卷由Docker来创建和管理. 你可以直接使用 ``docker volume create`` 命令来创建一个数据卷, 或者由Docker在创建容器或服务时自动创建.

当创建好一个数据卷时, 它被存储在宿主机的一个目录下. 当把数据卷挂载到容器时, 这个目录就被挂在到了容器下. 这个行为与绑定挂载类似, 不过数据卷是由Docker来管理, 与宿主机的核心系统隔离.

一个数据卷可以同时被挂在到多个容器下. 当没有运行中的容器使用到时, 这个数据卷对Docker来说也仍然存在, 不会被自动删除. 你可以用 ``docker volume prune`` 命令来删除所有未被使用的数据卷.

当你挂载了一个数据卷, 它可能是具名的或匿名的. 匿名数据卷会由Docker生成一个随机的唯一标识. 和具名数据卷一样, 即使你删除了容器, 匿名数据卷也会继续存在. 除非你在创建容器时用了 ``--rm`` 标识. 如果在创建容器时加了 ``--rm`` 标识, Docker就会自动移除匿名数据卷. 具体可查看[移除匿名数据卷](https://docs.docker.com/storage/volumes/#remove-anonymous-volumes).

数据卷同时还支持卷驱动器, 这让你可以将数据存储在远程主机或云提供商等更多可能的地方.

### 绑定挂载

TODO: ...

### tmpfs

TODO: ...

### 命名管道

TODO: ...

## 适合用数据卷的情况

TODO: ...

## 适合用绑定挂载的情况

TODO: ...

## 适合用 tmpfs 挂载的情况

TODO: ...

## 使用绑定挂载或数据卷时的注意事项

TODO: ...

## 下一步

- 更多关于[数据卷](https://docs.docker.com/storage/volumes/).
- 更多关于[绑定挂载](https://docs.docker.com/storage/bind-mounts/).
- 更多关于[tmpfs挂载](https://docs.docker.com/storage/tmpfs/).
- 更多关于[存储驱动](https://docs.docker.com/storage/storagedriver/), 这与绑定挂载合数据卷无关, 但能让你保存数据到容器可写层.
