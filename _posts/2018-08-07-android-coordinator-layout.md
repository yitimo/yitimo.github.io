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