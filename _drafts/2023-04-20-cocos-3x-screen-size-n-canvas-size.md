---
layout: post
title: cocos 3.x 如何转换屏幕尺寸与画布尺寸
date: 2023-04-20 15:00:12 +0800
author: yitimo
categories: game dev
tags: ["game dev"]
keywords:
- game dev,
description: Cocos 3.x screen size and canvas size
---

一些现状:

- cocos项目中涉及了多种尺寸, 其中主要包括了屏幕尺寸(screen size)和画布尺寸(canvas size).
- cocos项目的``项目设置``中, 可以填写``设计尺寸``, 还有``适配屏幕宽度``和``适配屏幕高度``两个开关选项.
- cocos项目中默认的2d坐标系, 中间点为 ``Vec2(0, 0)``, 而屏幕坐标下, 左下角为 ``Vec2(0, 0)``.
- 硬件设备多少都支持了两倍屏甚至三倍屏, 也就是实际屏幕像素高于代码里的像素值.

本文将基于 ``cocos 3.x`` 的移动端全屏环境分析**如何完美转换屏幕尺寸与画布尺寸**.

## 画布宽高比与屏幕宽高比一致

## 屏幕宽高比偏瘦或偏胖时

## 细究尺寸概念

TODO: 待完成
