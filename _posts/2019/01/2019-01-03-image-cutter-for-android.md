---
layout: post
title:  Android图片裁剪工具封装
date:   2019-01-03 15:19:31 +0800
author: yitimo
categories: Android
tags: ["Android", "kotlin", "photo cutter"]
keywords:
- Android,
- kotlin,
- photo cutter,
description: 基于kotlin，Android图片裁剪工具的封装
---

笔者从零开始开发Android，而且是跳过java直接使用kotlin开发，这其中的好处是可以避开java这门传统语言诸多的潜规则，难处是相比资深Android开发者少了许多可以现用的工具库。比如Android对图片的支持就非常开放，换言之就是非常依赖一个成熟的工具库(比如Glide)，(相比web里<img>标签就安全易用很多)。

包括本文将实现的工具在内，笔者目前也收集了整整2个成熟好用的图片相关工具类，一个就是[Glide](https://github.com/bumptech/glide)，另一个是[Subsampling Scale Image View](https://github.com/davemorrissey/subsampling-scale-image-view)，并且膨胀地以为不再需要其他任何图片相关的工具库了。这个想法差点被动摇的一次就是现在需要加一个图片裁剪功能了，一想到网上现有的那些酷炫的工具库，就担心起要不要用和用哪个的问题，但是当笔者看了这篇文章——[How We Created uCrop](https://yalantis.com/blog/how-we-created-ucrop-our-own-image-cropping-library-for-android/)，就对引入第三方图片裁剪库更加抵触了，思来想去自己内心的想法都是：
**为了传一张图片然后确定参数挖出一张新图片来这样一个需求而以来别人开发的自己无法控制或灵活定制的库是不值得的**。

本文将纯依赖``SubsamplingScaleImageView``来实现一个支持缩放和旋转的图片裁剪组件，``SubsamplingScaleImageView``帮助我完成了其中图片缩放、旋转、拖拽的底层触摸交互以及图片的内存管理工作，这让我可以专心的利用这些动作来确定一件事：**我需要裁剪出一张图片如何旋转/缩放后的哪个部分**。然后就可以根据这些信息从原图创建出需要的裁剪图。

依靠``SubsamplingScaleImageView``已经具备的能力，这个图片裁剪组件的kotlin代码目前包含非关键代码在内也只有300行出头。

## 实现过程总览

纵观整个图片裁剪工具，其实现分这么几步：

* 自定义View的基本结构和布局
* 拖拽位置边界的保护
* 旋转能力和执行裁剪

## 自定义View

首先给这个图片裁剪工具起个难听的名字叫做``YmageCutterView``，其布局基于``ConstraintLayout``中间放一个指定宽高的矩形作为裁剪框，四周是四个半透明矩形作为遮罩，底下是原图。设想就是缩放和拖拽原图，再以中间裁剪框作为边界裁剪出目标图。像这样：
``` xml
<android.support.constraint.ConstraintLayout android:layout_width="match_parent"
    android:layout_height="match_parent"
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:background="#333333">
    <com.davemorrissey.labs.subscaleview.SubsamplingScaleImageView
        android:id="@+id/ymage_cutter_origin"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
    <View android:id="@+id/ymage_cutter_mask_left"
        android:layout_width="0dp"
        android:layout_height="0dp"
        android:background="#99000000"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toStartOf="@id/ymage_cutter_frame" />
    <View
        android:id="@+id/ymage_cutter_mask_right"
        android:layout_width="0dp"
        android:layout_height="0dp"
        android:background="#99000000"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toEndOf="@id/ymage_cutter_frame"
        app:layout_constraintEnd_toEndOf="parent"/>
    <View
        android:id="@+id/ymage_cutter_mask_top"
        android:layout_width="0dp"
        android:layout_height="0dp"
        android:background="#99000000"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toTopOf="@id/ymage_cutter_frame"
        app:layout_constraintStart_toEndOf="@id/ymage_cutter_mask_left"
        app:layout_constraintEnd_toStartOf="@id/ymage_cutter_mask_right"/>
    <View
        android:id="@+id/ymage_cutter_mask_bottom"
        android:layout_width="0dp"
        android:layout_height="0dp"
        android:background="#99000000"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintTop_toBottomOf="@id/ymage_cutter_frame"
        app:layout_constraintStart_toEndOf="@id/ymage_cutter_mask_left"
        app:layout_constraintEnd_toStartOf="@id/ymage_cutter_mask_right"/>
    <View
        android:id="@+id/ymage_cutter_frame"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toEndOf="@id/ymage_cutter_mask_left"
        app:layout_constraintEnd_toStartOf="@id/ymage_cutter_mask_right"
        app:layout_constraintWidth_percent="0.7"
        app:layout_constraintWidth_max="300dp"
        app:layout_constraintDimensionRatio="1:1"/>
</android.support.constraint.ConstraintLayout>
```

然后为了使裁剪尺寸支持自定义，需要设置一个自定义参数叫``ratio``，用来传入需要裁剪图片的宽高比，比如支持这么使用：
``` xml
<com.yitimo.ymage.cutter.YmageCutterView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        app:ratio="4:3"/>
```
上面这样中间的裁剪框就是个4:3的矩形。至于用户通过拖拽实时更改这个裁剪框尺寸这个需求，本文还未去实现，讲真其使用场景也不多，后续再考虑补足。由于使用的是``ConstraintLayout``，只需要将传入的``ratio``属性设置给中间裁剪框的``layoutParams.dimensionRatio``就完成裁剪图片宽高比的更新了。

## 拖拽位置边界的保护

``SubsamplingScaleImageView``本身已经实现了较完整的触摸交互，包括拖拽和缩放，在它的基础上我们先加一个边界保护：
``` kotlin
originIV.setOnTouchListener { _, event ->
    when (event.action) {
        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
            inDrag = false
            inCheck = false
            lazyCheck?.cancel()
            lazyCheck = null
            lazyCheck = Timer().schedule(100) {
                if (!inDrag && !inCheck) {
                    inCheck = true
                    resolvePositionCheck()
                }
            }
        }
        MotionEvent.ACTION_DOWN -> {
            inDrag = true
        }
    }
    return@setOnTouchListener false
}
```

以上代码做了这么几件事情：

1. 手指按下时指示正在拖拽
2. 手指抬起后100毫秒内若未再次按下，则执行边界检查

边界检查实现如下：

``` kotlin
private fun resolvePositionCheck() {
    val center = originIV.center ?: return
    val x: Float
    val y: Float
    if (originIV.orientation == rotation0 || originIV.orientation == rotation180) {
        val left = frameV.width/2/originIV.scale
        val top = frameV.height/2/originIV.scale
        val right = left + (originIV.sWidth*originIV.scale - frameV.width)/originIV.scale
        val bottom = top + (originIV.sHeight*originIV.scale - frameV.height)/originIV.scale
        limitRect.set(left, top, right, bottom)
        x = if (center.x < limitRect.left) {
            if (originIV.sWidth*originIV.scale < frameV.width) {
                if (center.x < limitRect.right) {
                    limitRect.right
                } else {
                    center.x
                }
            } else {
                limitRect.left
            }
        } else if (center.x > limitRect.right) {
            if (originIV.sWidth*originIV.scale < frameV.width) {
                limitRect.left
            } else {
                limitRect.right
            }
        } else {
            center.x
        }
        y = if (center.y < limitRect.top) {
            if (originIV.sHeight*originIV.scale < frameV.height) {
                if (center.y < limitRect.bottom) {
                    limitRect.bottom
                } else {
                    center.y
                }
            } else {
                limitRect.top
            }
        } else if (center.y > limitRect.bottom) {
            if (originIV.sHeight*originIV.scale < frameV.height) {
                limitRect.top
            } else {
                limitRect.bottom
            }
        } else {
            center.y
        }
    } else {
        val left = frameV.width/2/originIV.scale
        val top = frameV.height/2/originIV.scale
        val right = left + (originIV.sHeight*originIV.scale - frameV.width)/originIV.scale
        val bottom = top + (originIV.sWidth*originIV.scale - frameV.height)/originIV.scale
        limitRect.set(left, top, right, bottom)
        x = if (center.x < limitRect.left) {
            if (originIV.sHeight*originIV.scale < frameV.width) {
                if (center.x < limitRect.right) {
                    limitRect.right
                } else {
                    center.x
                }
            } else {
                limitRect.left
            }
        } else if (center.x > limitRect.right) {
            if (originIV.sHeight*originIV.scale < frameV.width) {
                limitRect.left
            } else {
                limitRect.right
            }
        } else {
            center.x
        }
        y = if (center.y < limitRect.top) {
            if (originIV.sWidth*originIV.scale < frameV.height) {
                if (center.y < limitRect.bottom) {
                    limitRect.bottom
                } else {
                    center.y
                }
            } else {
                limitRect.top
            }
        } else if (center.y > limitRect.bottom) {
            if (originIV.sWidth*originIV.scale < frameV.height) {
                limitRect.top
            } else {
                limitRect.bottom
            }
        } else {
            center.y
        }
    }
    if (x != center.x || y != center.y) {
        GlobalScope.launch(Dispatchers.Main) {
            originIV.animateCenter(PointF(x, y))
                    ?.withDuration(100)
                    ?.withEasing(SubsamplingScaleImageView.EASE_OUT_QUAD)
                    ?.withInterruptible(false)
                    ?.start()
        }
    }
}
```

算是这个裁剪组件里最长的一个方法了，比较不美观的套了很多条件检查值得去优化，不过做的事情描述起来很简单，就是**如果原图没有完全包含在裁剪框中则按最近路径移动进来**。比如安卓微信里的头像裁剪，图片就可以任意移出裁剪框，笔者觉得这样不妥。

## 旋转能力和执行裁剪

图片的旋转只需设置``SubsamplingScaleImageView``的``orientation``即可，麻烦的是不同旋转角度下原图的宽高要区分处理，也就是说，0度和180度下原图的宽就是宽，高就是高，但90度和270度下原图的宽是高而高是宽。这在上文边界保护和下文执行裁剪时都要加以区分处理。

执行裁剪作为一个方法提供给外界调用，实现如下：
``` kotlin
fun shutter(): Bitmap? {
    if (resultBitmap?.isRecycled == false) {
        resultBitmap?.recycle()
    }
    val center = originIV.center ?: return null
    val cut = Rect(
            (center.x - frameV.width/2/originIV.scale).toInt(),
            (center.y - frameV.height/2/originIV.scale).toInt(),
            (center.x + frameV.width/2/originIV.scale).toInt(),
            (center.y + frameV.height/2/originIV.scale).toInt()
    )
    val bitmap = BitmapFactory.decodeFile(src)
    val matrix = Matrix()
    matrix.postRotate(originIV.orientation.toFloat())
    val rotatedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    resultBitmap = Bitmap.createBitmap(rotatedBitmap, Math.max(cut.left, 0), Math.max(cut.top, 0), Math.min(cut.right-cut.left, rotatedBitmap.width), Math.min(cut.bottom-cut.top, rotatedBitmap.height), null, true)
    if (bitmap != resultBitmap && !bitmap.isRecycled) {
        bitmap.recycle()
    }
    if (rotatedBitmap != resultBitmap && !rotatedBitmap.isRecycled) {
        rotatedBitmap.recycle()
    }
    return resultBitmap
}
```

此方法做的事情就是，先将原图根据当前的旋转角度旋转得到源bitmap，再根据当前原图的缩放和位置确定裁剪图片的起点坐标(x,y)以及宽高，调用``createBitmap``挖出裁剪图，最后返回裁剪后的目标bitmap。

## 总结

至此这个图片裁剪组件已经完成，说白了是以自定义View的形式对``SubsamplingScaleImageView``进行扩展和二次封装，使用起来需要把这个View放到自己的Activity中，目前支持传入ratio属性设置裁剪图的宽高比，并提供了这么几个方法供调用：

1. ``reset()`` 重设图片的旋转和缩放
2. ``rotate(degree: Int)`` 执行旋转，角度必须为 ``0, 90, 180, 270``的其中一个
3. ``shutter(): Bitmap?`` 按快门方法，执行裁剪并返回bitmap

最后再次膜拜``SubsamplingScaleImageView``并附上本文项目[Github地址](https://github.com/yitimo/ymage)。
