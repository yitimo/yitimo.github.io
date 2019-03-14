---
layout: post
title:  Android中使用帶圓角佈局
date:   2018-08-06 09:08:31 +0800
author: yitimo
categories: Android
tags: ["android", "round corner"]
keywords:
- android,
- round corner,
description: 在Android中使用圓角佈局，並防止被子組件遮擋圓角部分。 Use round corner layout in Android, and avoid conversation of child views.
---

在Android中個人認爲有幾個支持不足的能力，其中就包括``圓角``、``陰影``這兩個。先説一個在Web中再平常不過的需求——實現一個帶圓角的圖片輪播。筆者不才，先後試了``shape``方式、``CardView``方式、``直接裁剪圖片``方式，均達不到預想的效果，表現分別如下：

* 前兩種方式能使容器得到圓角效果，但其子view超出圓角的部分不會被圓角給遮擋，而是直接超出了，最終效果就是雖然容器是圓角的，但整個圖片輪播板塊還是個正大的矩形。
* 直接裁剪圖片的話，想來性能肯定不如前兩種方式，但倒是絕對能得到圓角的圖片，但是容器并未實現圓角，導致滑動圖片時圓角跟隨圖片移動而不是固定在四個角落起遮擋效果，也就是說在滑動過程中組件仍是矩形，甚至圓角會在中間移來移去，效果比沒有圓角甚至更差勁。
* ``CardView``或許是筆者使用方式不對，据許多文章所説就是用來很好的處理圓角容器的，也只會在低版本下會存在問題且均有兼容辦法。然而筆者無論如何使用效果均與定義一個``shape``一樣，也就是矩形子組件仍能完美超出并遮住圓角，那我還要你有什麽用，爲了省一個``shape``，多引入一整個庫?

## 自定義View并切割方式

最終達到筆者想要效果的只有一種方式，即自定義一個``View``容器，可以繼承想要的佈局，然後在這個``View``中對最終的效果進行圓角切割。代碼非常簡短，所以直接貼出：

```
class RoundedCornerLayout(context: Context, attributeSet: AttributeSet?): FrameLayout(context, attributeSet) {
    private var _cornerRadius = 10.0f
    private var cornerRadius: Float = 0.toFloat()
    init {
        val ta = context.obtainStyledAttributes(attributeSet, R.styleable.RoundedCornerLayout, 0, 0)
        try {
            _cornerRadius = ta.getDimension(R.styleable.RoundedCornerLayout_corner, 10.0f)
        } finally {
            ta.recycle()
        }

        val metrics = context.resources.displayMetrics
        cornerRadius = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, _cornerRadius, metrics)
        setLayerType(View.LAYER_TYPE_SOFTWARE, null)
    }
    override fun dispatchDraw(canvas: Canvas) {
        val count = canvas.save()

        val path = Path()
        path.addRoundRect(RectF(0f, 0f, canvas.width.toFloat(), canvas.height.toFloat()), cornerRadius, cornerRadius, Path.Direction.CW)
        canvas.clipPath(path)
        super.dispatchDraw(canvas)
        canvas.restoreToCount(count)
    }
}
```

這裏在類中定義了默認的圓角弧度，並支持在``layout``中傳入，做的事情也很簡單，重寫``dispatchDraw``對畫布進行圓角切割，這樣得到的圓角容器，裏面的子組件就再超不出圓角了(其實還是超出了，但是超出部分被切掉了)。

## 總結

對於網上許多不建議自定義視圖並切割，而是使用新版本引入的``CardView``能力的言論，筆者實在無才讓子組件不超出``CardView``的圓角，而筆者的需求也很簡單，僅僅是要一個圓角的輪播圖片組件罷了，相比切割每一張輪播圖片，肯定是切割容器在性能與效果上會好很多，客觀來説此種方式犧牲的有以下幾點：

1. 潛在的相對的性能開支(目前沒發現)
2. 不支持邊框
3. 設置陰影會發現陰影是按照矩形輪廓來呈現的，需要另作適配

[參考鏈接](https://stackoverflow.com/questions/26074784/how-to-make-a-view-in-android-with-rounded-corners)

但這在web中就是個``overflow:hidden + border-radius``的事情啊拜托。
