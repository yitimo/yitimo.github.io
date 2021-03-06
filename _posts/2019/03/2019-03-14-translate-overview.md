---
layout: post
title:  【翻译】Overview
date:   2019-03-14 16:11:13 +0800
author: yitimo
categories: chrome-extension
tags: ["chrome extension", "translation"]
keywords:
- chrome extension,
- translation,
description: Translation for <Overview>.
---

原文链接：[Overview](https://developer.chrome.com/extensions/overview)

Chrome插件(以下简称插件)是JS、CSS、HTML、图片等web平台常用资源的压缩打包体，并定制了Chrome浏览器的一些能力。插件使用web技术搭建，支持与web平台相同的API。

插件具有广泛的可能性。它可以修改用户看到的web内容，可以互动、扩展或改变浏览器行为。

可以认为插件是使Chrome最具个性化的一大途径。

## 插件的文件结构

一个插件可以包含许多文件和目录，且一定都有一个``manifest``。有些简单但有用的插件甚至只由manifest和一个图标组成。

manifest即``manifest.json``文件，告诉了浏览器关于插件的基本信息，包括最重要的几个文件，以及插件会使用到哪些能力。

插件一定都有一个图标，显示在浏览器的工具栏。工具栏图标很方便用户访问到，且能让用户看到自己安装了哪些插件。大多数用户都会通过这个图标与弹出页面交互。

### 文件资源

插件中的文件可以通过相对路径访问到，像这样：``<img src="images/my_image.png">``。
同时也可以通过绝对路径访问到，像这样：``chrome-extension://<extensionID>/<pathToFile>``。

在绝对路径中，``extensionID``是插件系统为每个插件分配的唯一标识。所有已加载的插件都可以在``chrome://extensions``中访问到其ID。

当调试未打包的插件时，这个ID会根据所在目录的不同而变化，当插件被打包后，ID将又不同。如果插件开发过程中要用到绝对路径，可以调用``chrome.runtime.getURL()``来避免硬编码ID。

## 架构

一个插件的架构如何取决于其实现的具体功能。而许多健壮的插件都会包含多个组件：

* manifest
* 后台脚本 background script
* 界面元素 UI Elements
* 内容脚本
* 选项页面

### 后台脚本（背景页脚本）

后台脚本是插件的事件处理者，包含了对于插件比较重要的浏览器事件的监听，它会保持休眠，仅在事件触发时执行指定逻辑。有效的后台脚本仅在需要的时候被加载。

### 界面元素

插件的用户界面需要是较简单且有目的性的。界面需要定制或加强浏览器体验，又不会使其混乱。大多数插件都包含浏览器行为和页面行为，但也可以有其他形式的界面，比如内容菜单，地址栏使用以及键盘快捷键等。

插件的用户界面，比如弹出层，可以包含平常的web页面和JS脚本。插件还可以调用``tabs.create``或``window.open()``来显示额外的页面。

使用了``page action``和弹出层页面的插件可以使用可声明的内容接口来在后台脚本中设定规则，只要触发了特定条件，后台脚本就可以将插件按钮设为可用，以与弹出页面进行交互。

### 内容脚本

插件使用内容脚本来读写web页面。内容脚本包含了在已加载到浏览器的页面内容的JS脚本。可以读取或修改web页面的DOM。内容脚本可以通过消息与父级插件交互，也可以通过storage接口来交互。

### 选项页面

正如插件允许用户来定制浏览器本身，选项页面则允许用户来定制插件本身。选项页面可以让用户来开关特定功能（如果有需要的话）。

## 使用Chrome接口

除了访问与普通web项目相同的API之外，插件还可以调用插件专用的API，这些API更贴近浏览器原生能力。插件和web页面都可以调用到``window.open()``方法来打开一个地址，但插件还可以通过``tabs.create``指定在哪个窗口显示要打开的地址。

### 异步方法和同步方法

大多数浏览器API都是异步的，它们会立即返回而不是等待操作执行完成。如果插件需要知道一个异步操作的执行结果，则可以通过传递回调函数的方式。

如果插件需要从用户当前选项卡页面导航到一个新地址，就需要获取到当前选项卡的ID然后更新其打开的地址。

如果``tabs.query``方法是同步的，做法可能是这样：

``` javascript
//THIS CODE DOESN'T WORK
var tab = chrome.tabs.query({'active': true}); //WRONG!!!
chrome.tabs.update(tab.id, {url:newUrl});
someOtherFunction();
```

上面的代码会失败因为``query()``是一个异步方法，正确的做法是这样：

``` javascript
//THIS CODE WORKS
chrome.tabs.query({'active': true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, {url: newUrl});
});
someOtherFunction();
```

## 页面间交互

同一插件的不同组件之间经常需要交互。HTML页面之间可以通过``chrome.extension``找到彼此，比如``getViews()``和``getBackgroundPage()``方法。当页面得到了其他插件页面的引用时就可以调用其他页面中的方法以及操作其DOM了。除此之外，所有页面都可以共用一个``storage``接口，以及进行消息通信。

## 保存数据和匿名模式

插件可以通过storage接口，HTML5的storage接口，以及服务器请求来实现数据保存。当插件需要保存数据时，先考虑是否处于一个匿名窗口中。默认情况下，插件不会运行在匿名窗口中。

匿名模式(Incognito mode)承诺窗口不会留下痕迹。当在匿名模式下处理数据时，插件也需要遵守这个承诺。如果插件正常情况下是要保存浏览历史的，在匿名模式下就不要这么做。然而，插件可以在任何窗口下保存偏好设定，匿名模式下也是。

可以检查``tabs.Tab``的``incognito``属性来检查是否处于匿名模式下，或者``windows.Window``。

``` javascript
function saveTabData(tab) {
    if (tab.incognito) {
        return;
    } else {
        chrome.storage.local.set({data: tab.url});
    }
}
```
