---
layout: post
title:  Android中使用CoordinatorLayout進行佈局
date:   2018-08-07 09:29:31 +0800
author: yitimo
categories: jekyll update
tags: ["android", "Coordinator Layout"]
keywords:
- android,
- CoordinatorLayout,
description: Usage of coordinator layout.
---

基於默認行爲的CoordinatorLayout至少要由5部分組成：

1. ``CoornaditorLayout``標簽本身
2. ``AppBarLayout``代表了實現滾動效果部分，即滾動主體(列表等)滾動時會做出需要的特效的部分
3. ``CollapsingToolbarLayout`` 字面意思即將摺叠部分的佈局，也就是之後滾動時要消失或是固定的佈局，直接放在``AppBarLayout``裏面
4. ``Toolbar``放在``CollapsingToolbarLayout``裏面，可以配置未摺叠時和摺叠后的行爲，直白的就是未摺叠時的大標題，摺叠后變成了左上角的小標題，這個就是靠``Toolbar``
5. 滾動主體本身，可以是個列表，也可以直接是個``NestedScrollView``，(不可以是``ScrollView``，這是個坑)，指定一個行爲后就可以與前4個部分進行響應了，默認行爲就用``appbar_scrolling_view_behavior``，也可以自定義行爲

CoordinatorLayout AppBarLayout 與滾動主題 這三部分是固定的標簽，一般都是如下形式:

```
<android.support.design.widget.CoordinatorLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context="指定你的Activity">
    <android.support.design.widget.AppBarLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content">
        <!-- 具體特效佈局 -->
    </android.support.design.widget.AppBarLayout>

    <android.support.v4.widget.NestedScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent">
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_gravity="center_vertical"
            android:orientation="vertical">
            <!-- 滾動主體佈局 -->
        </LinearLayout>
    </android.support.v4.widget.NestedScrollView>
</android.support.design.widget.CoordinatorLayout>
```

## CollapsingToolbarLayout

此佈局估計是導致``CoornaditorLayout``易使人困惑的萬惡之源，相對的``Toolbar``其實是個可有可無的標簽，是用來錦上添花的。
``CollapsingToolbarLayout``中最重要的屬性是``layout_scrollFlags``和``contentScrim``，前者直接決定這個佈局要如何相應滾動，後者決定標簽滾動至頂部以上(消失)時會漸變至設定的顔色，``layout_scrollFlags``有以下幾個值可以設定：

1. 不設置值 可以保持固定，不會隨滾動而消失了，可以理解爲： 未到頂部時跟隨滾動，到頂部后就固定在頂部。所以是個好東西，可以用來裝``TabLayout``之類的導航標簽。
2. ``scroll`` 字面意思，就是正常滾動
3. ``enterAlways`` 單獨使用時與直接不加``layout_scrollFlags``一樣
4. ``enterAlwaysCollapsed`` 單獨使用時與直接不加``layout_scrollFlags``一樣
5. ``snap`` 單獨使用時與直接不加``layout_scrollFlags``一樣
6. ``exitUntilCollapsed|scroll`` 這兩者一起並配上 ``contentScrim``，上滑時標簽會上滑至看不見(``scroll``的效果)，且還會漸變至設定的顔色(``contentScrim``的效果)
7. ``enterAlways|scroll`` 上滑時效果跟``scroll``一樣，但只要下滑就會出現``enterAlways``，會受``contentScrim``影響，下滑時保持設定的顔色