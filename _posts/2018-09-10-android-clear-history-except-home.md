---
layout: post
title:  Android中移除除了首页的历史Activity
date:   2018-09-10 09:18:31 +0800
author: yitimo
categories: jekyll update
tags: ["android", "activity stack"]
keywords:
- android,
- round corner,
- activity stack,
description: Android中如何在打开新页面时清空除了首页的历史纪录，即从新页面返回时为首页
---

对于Android中Activity栈的操作提及比较多的是在``Intent``中使用这几个``Flag``:

* Intent.FLAG_ACTIVITY_CLEAR_TASK
* Intent.FLAG_ACTIVITY_CLEAR_TOP
* Intent.FLAG_ACTIVITY_NEW_TASK

其中一个使用情景是，当用户的登录状态过期后，需要清除历史纪录直接重定向到登录页，也就是当前打开页面为``A -> B -> C``时，发现登录已过期需要跳转到``D``，就需要:

```
val intent = Intent(Context, D)
intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK)
intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
```
这样跳转到``D``后整个应用只会留下``D``页面。

但是靠这几个Flag做不到一件事，就是本文标题所描述的，**如何从``A -> B -> C``想要跳转到``D``时得到``A -> D``这样的页面栈**，即在跳转到新页面时移除除了首页外的其他页面，得到从新页面返回时直接是回到首页的效果。

此需求的使用场景之一就是在购物下单流程中，用户选择完商品并下单后，原先的商品或购物车页面已经不再需要，甚至如果不清除掉这些页面，当用户从订单页返回时又会回到下单前的状态，已经完成购买的商品，数量都还留在页面里。

最终对笔者起到帮助的只有[这个链接](https://stackoverflow.com/questions/38879150/clear-activity-stack-except-first-activity)。

上面的链接让笔者最终决定使用的做法是：当从``C``跳转到``D``时，添加参数``putExtra("clear_top", true)``，并在``D``的``onBackPressed()``中判断此参数，若为``true``则使用上文提及的方式清除所有页面并跳转到首页，否则正常执行返回流程。此方法没有使用上文提及的几个``Flag``，或者说笔者没发现这几个``Flag``有达到此效果的能力。