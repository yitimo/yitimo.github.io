---
layout: post
title:  Android 编写一个图片选择器
date:   2018-10-02 08:37:31 +0800
author: yitimo
categories: jekyll update
tags: ["android", "image picker"]
keywords:
- android,
- image picker,
description: 实现一个Android端的图片选择工具，并发布到jcenter
---

笔者项目中遇到需要选择图片的情况，一开始直接使用的是知乎开源的[Matisse](https://github.com/zhihu/Matisse)，(下文要讲述的自己实现的图片选择工具也从中参考了一些实现)。至于之后为什么要选择自己来实现一个选择器，原因大概如下：

1. 难度不高(很大的原因是因为把图片渲染工作交给了``Glide``)
2. 想要自己深度定制
3. 第2点的定制内容比如：**第一次选择好图片后，再次进入图片选择器支持记录上次已选中的图片**。

## 实现思路

整个图片选择器工具的实现思路大致如下：

1. 项目准备
2. 解藕``Glide``
3. 实现列表浏览
4. 实现原图浏览
5. 与原页面交互实现选择

## 准备工作

笔者使用的是``AndroidStudio`` + ``kotlin``开发(*Java是不可能Java的*)，并且目标是一个第三方库而不是完整应用。

首先新建一个``Project``：

![新建Project](/assets/images/201810/post-1.png)

新建自带的这个应用作为试例应用取名叫``Sample``：

![新建Project](/assets/images/201810/post-2.png)

然后``File -> New -> New Module``创建出工具类自己的模块：

![新建Module](/assets/images/201810/post-3.png)

最终得到了这样一个目录结构：

![基本目录结构](/assets/images/201810/post-4.png)

## 图片引擎

Android中图片的处理是个危险操作，很容易浪费性能甚至导致应用崩溃，笔者因此深度依赖了``Glide``这个库来处理图片，不过作为第三方库想要使用``Glide``，自己再引入一个``Glide``就会显得多余，而应该在最外层应用中配置好``Glide``，引入的第三方库若以来``Glide``，也应该使用外层的``Glide``，这就需要将第三方库与``Glide``的耦合给解开。笔者最终采用的思路类似``Matisse``，就是外层应用需要配置一个代码片段来传入并告诉我们的图片选择工具如何使用``Glide``。

图片选择器需要准备一个结构体，来放置一些图片渲染的回调方法：

```
var setOrigin: ((context: Context, src: File, width: Int, height: Int, callback: (Bitmap) -> Unit) -> Unit)? = null
var setCommon: ((context: Context, imageView: ImageView, src: File) -> Unit)? = null
var setThumb: ((context: Context, imageView: ImageView, src: File, size: Int, fade: Int, holderRes: Int) -> Unit)? = null
var pauseGlide: ((context: Context) -> Unit)? = null
var resumeGlide: ((context: Context) -> Unit)? = null
```

其中``setOrigin``用于设置原图图片，``setCommon``用于直接设置图片作为通用方法，``setThumb``用于设置封面图，``pauseGlide``与``resumeGlide``方法用于帮助在页面滚动时暂停和继续``Glide``的渲染工作以避免此类卡顿情况。

最终应用中必须在某处(比如``BaseApplication``)执行一个代码片段，来将``Glide``配置给图片选择工具：

```
Ymager.setOrigin = fun (context: Context, src: File, width: Int, height: Int, callback: (Bitmap) -> Unit) {
    GlideApp.with(context).asBitmap().load(src).override(width, height).fitCenter().into(object: SimpleTarget<Bitmap>() {
        override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
            callback(resource)
        }
    })
}
Ymager.setCommon = fun (context: Context, imageView: ImageView, src: File) {
    GlideApp.with(context).load(src).into(imageView)
}
Ymager.setThumb = fun (context: Context, imageView: ImageView, src: File, size: Int, fade: Int, holderRes: Int) {
    GlideApp.with(context)
            .load(src)
            .error(holderRes)
            .transition(DrawableTransitionOptions.withCrossFade(fade))
            .override(size, size)
            .into(imageView)
}
Ymager.pauseGlide = fun (context: Context) {
    GlideApp.with(context).pauseRequests()
}
Ymager.resumeGlide = fun (context: Context) {
    GlideApp.with(context).resumeRequests()
}
```

对于笔者的这个图片选择器来说，应用中配置的方法内容很固定，每个渲染方法各自用于选择器中的一处需要渲染图片的地方，包括列表图片、相册封面以及原图。

## 图片数据库工具类

图片选择器使用的数据源是系统相册数据库，这就需要执行数据库查询语句了，所以需要准备这么一个[数据库工具类](https://github.com/yitimo/ymage/blob/master/ymage/src/main/java/com/yitimo/ymage/DBUtils.kt)，包含了如下方法：

* queryAlbums -> 查询所有的图片集，或者叫相册，Android中叫做``Bucket``
* query -> 查询所有的图片，支持指定某个图片集
* queryChosen -> 传入默认选中的图片地址列表，查询出这些图片
* first -> 查询第一张图片，用于作为``全部``这个``Bucket``的封面

## 列表展示

列表展示需要以每行固定格子数的形式来展示比较小的图片列表，所以要使用的是``RecyclerView``搭配``GridLayoutManager``，列表数据传入``Cursor``来动态的从数据库中取出图片数据，而不是一口气取出成百上千张图片数据，再一口气传入``Adapter``中。

与通常``RecyclerView``使用的``adapter``的不同在于，列表使用的``adapter``传入的是一个数据库查询得到的``Cursor``。

具体代码实现在[这里](https://github.com/yitimo/ymage/blob/master/ymage/src/main/java/com/yitimo/ymage/ListAdapter.kt)。

## 原图展示

原图展示需要全屏显示某张图片，并支持缩放和左右切换图片。所以使用了``ViewPager``搭配``PagerAdapter``来实现。同样是传入``Cursor``，动态根据``position``取出图片信息并渲染。

具体代码实现在[这里](https://github.com/yitimo/ymage/blob/master/ymage/src/main/java/com/yitimo/ymage/OriginAdapter.kt)。

## 总结

剩余的工作包含了：

1. ``Bucket``列表的展示与切换，即根据``BucketId``来查询数据并使用第一张图作为封面。切换相册即只查询指定``BucketId``图片列表的``Cursor``并更新到``ListAdapter``。
2. 选好图片后，通过intent传递选中的图片数据。
3. 发布到``bintray``的流程，这个网上有很多了，大体就是``注册 -> 创建项目 -> 配置自己的项目 -> 执行项目``这几步完事。

完整项目的``Github``地址在[这里](https://github.com/yitimo/ymage)。
