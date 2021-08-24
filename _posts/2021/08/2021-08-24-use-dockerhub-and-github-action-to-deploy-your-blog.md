---
layout: post
title: 使用dockerhub和GitHub action来自动化部署你的博客
date: 2020-08-24 20:00:12 +0800
author: yitimo
categories: deploy
tags: ["deploy"]
keywords:
- deploy,
description: Use dockerhub and github action to auto deploy your blog.
---

## Docker做了什么

docker是基于容器的虚拟机, 围绕着镜像和容器来工作。Dockerfile 描述了如何配置这个镜像, 比如基于哪个镜像, 复制哪些文件, 执行哪些命令。

### 传统的应用线上部署

大致要做这些事:

1. 配置服务器环境
2. 配置依赖
3. 上传release资源到服务器
4. 运行程序
5. 当更换、扩展服务器时, 都要重新配置服务器环境
6. 多个应用同时运行在宿主机, 依靠目录、用户、端口等区分

### 基于docker的应用线上部署

大致要做这些事:

1. 服务器和本地各安装好docker
2. 本地工程在 Dockerfile 里进行配置
3. 构建应用到docker镜像并发布
4. 在服务器上运行这个镜像
5. 当更换、扩展服务器时, 重新安装docker即可
6. 多个应用相互隔离, 通过容器id区分, 通过端口通信

Docker常用命令:

- 创建本地调试用的docker镜像: ``docker build -t [镜像名字]:[镜像tag] .``
- 列出docker镜像: ``docker image ls``
- 创建docker容器: ``docker create -p [运行在宿主机哪个端口]:80 --name [容器名字] -t [镜像名字]:[镜像tag]``
- 列出docker容器: ``docker container ls``
- 运行docker容器: ``docker container run [容器名 或 容器id前几位]``
- 停止docker容器: ``docker container stop [容器名 或 容器id前几位]``
- 删除docker容器: ``docker container rm [容器名 或 容器id前几位]``
- 删除docker镜像: ``docker image rm [镜像名+tag 或 镜像id前几位]``
- 清理冗余docker镜像: ``docker image prune -f``

## GithubAction做了什么

支持我们指定在 ``哪个分支`` 发生 ``什么事件`` 时, 基于 ``哪个环境`` 执行 ``哪些行为``。

比如本博客当下的配置:

``` yaml
name: Docker Image CI # 名字
on:
  push:
    branches: [ master ] # 响应master分支的push
  pull_request:
    branches: [ master ] # 响应master分支的PR
jobs:
  build:
    runs-on: ubuntu-latest # 基于ubuntu运行
    steps:
    - uses: actions/checkout@v2 # 内置的checkout行为
    - name: Build the Docker image # 基于当前分支创建docker镜像
      run: docker build . --file Dockerfile --tag yitimo/yitiblog:latest
    - name: Login to DockerHub # 登录到docker hub
      uses: docker/login-action@v1 
      with:
        username: ${{ secrets.DOCKER_USER_NAME }}
        password: ${{ secrets.DOCKER_TOKEN }}
    - name: Publish image to public docker hub # push建好的镜像到docker hub
      run: docker push yitimo/yitiblog:latest
```

## 还可以做什么

- docker 让我们能通过 **镜像+标签** 来管理线上发行版本的应用包
- github action 让我们能在应用push时自动化的构建出新的 docker 镜像并发布到远程仓库
- 此外 docker hub 也支持 webhook, 当新的镜像push过来时, 发送事件到我们个人服务器的自动化部署服务上, 然后由我们的自动化部署服务来直接 ``docker run`` 最新版本的镜像 :)
- 对于私有应用, 而不愿意发布到公共的 docker hub 的, 可以充钱使用其私有镜像, 也可以像笔者一样有限使用阿里云的私有镜像 :)
- docker应用基于端口来暴露服务到宿主机, 比如本博客运行的容器暴露了端口 xxxx, 然后还需要宿主机通过比如 nginx 来将外部域名(blog.yitimo.com)反向代理到端口 xxxx 上 :)

### 一张图总结

还没画好:)

## 扩展

- [Docker get started](https://www.docker.com/get-started)
- [Github action](https://docs.github.com/en/actions/quickstart)
- [阿里云容器镜像服务](https://www.aliyun.com/product/acr)
