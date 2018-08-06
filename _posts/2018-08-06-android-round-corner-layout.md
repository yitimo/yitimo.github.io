---
layout: post
title:  Android中使用帶圓角佈局
date:   2018-08-06 09:08:31 +0800
author: yitimo
categories: jekyll update
tags: ["android", "round corner"]
keywords:
- android,
- round corner,
description: 在Android中使用圓角佈局，並防止被子組件遮擋圓角部分。 Use round corner layout in Android, and avoid conversation of child views.
---

在Android中個人認爲有幾個支持不足的能力，其中就包括``圓角``、``陰影``這兩個。先説一個在Web中再平常不過的需求——實現一個帶圓角的圖片輪播。筆者不才，先後試了``shape``方式、``CardView``方式、``直接裁剪圖片``方式，均達不到預想的效果，表現分別如下：

* 前兩種方式能使容器得到圓角效果，但其子view超出圓角的部分不會被圓角給遮擋，而是直接超出了，最終效果就是雖然容器是圓角的，但整個圖片輪播板塊還是個正大的矩形。
* 直接裁剪圖片的話，想來性能肯定不如前兩種方式，但倒是絕對能得到圓角的圖片，但是容器并未實現圓角，導致滑動圖片時圓角跟隨圖片移動而不是固定在四個角落起遮擋效果，也就是說在滑動過程中組件仍是矩形，甚至圓角會在中間移來移去，效果比沒有圓角甚至更差勁。


