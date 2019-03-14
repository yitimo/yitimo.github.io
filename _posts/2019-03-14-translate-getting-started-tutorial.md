---
layout: post
title:  【翻译】Getting Started Tutorial
date:   2019-03-14 11:11:13 +0800
author: yitimo
categories: ChromeExtension
tags: ["chromeextension", "translation"]
keywords:
- chromeextension,
- translation,
description: Translation for <Getting Started Tutorial>.
---

原文链接：[Getting Started Tutorial](https://developer.chrome.com/extensions/getstarted)

Chrome插件(以下简称插件)由不同但有凝聚力的组件组成。这些组件包括 [background scripts](https://developer.chrome.com/background_pages.html)，[content scripts](https://developer.chrome.com/content_scripts.html)，[options page](https://developer.chrome.com/optionsV2)，[UI elements](https://developer.chrome.com/user_interface.html)，以及许多的具体逻辑页面。插件组件使用web开发技术实现：HTML、JS和CSS。一个插件要实现的功能决定了它将使用到哪些组件，而不是全都会用到。

本文将搭建一个插件，让用户可以更改``developer.chrome.com``站内所有页面的背景色。它将使用到许多核心组件以便介绍他们之间的关系。

首先创建一个新的目录来存放插件文件，完整的插件代码可以在[这里下载](https://developer.chrome.com/extensions/examples/tutorials/get_started_complete.zip)。

## 创建Manifest

插件都从它们的``manifest``起步，创建``manifest.json``包含以下内容，或直接[下载](https://developer.chrome.com/extensions/examples/tutorials/get_started/manifest.json)：

``` json
{
    "name": "Getting Started Example",
    "version": "1.0",
    "description": "Build an Extension!",
    "manifest_version": 2
}
```

现在这个插件可以直接在Chrome中添加(只有单个manifest文件，连页面和图标都没有)。

## 添加指令

尽管现在插件安装好了，它还没有任何指令。现在添加一个``background``属性，并创建相应文件(``background.js``)：

``` json
{
    "name": "Getting Started Example",
    "version": "1.0",
    "description": "Build an Extension!",
    "background": {
        "scripts": ["background.js"],
        "persistent": false
    },
    "manifest_version": 2
}
```

以上代码说明插件现在包含了一个非持久化运行的后台脚本，在里面可以做一些监听事件。

插件一旦安装就会需要一个持久化变量的信息。先在后台脚本中添加``runtime.onInstalled``事件的监听，回调中将设置一个值到storage中。并允许多个插件后续来访问和更新这个值：

```
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({color: '#3aa757'}, function() {
        console.log("The color is green.");
    });
});
```

包括``storage``在内的大多数API都必须在manifest的permissions属性中声明过，像这样：

``` json
{
    "name": "Getting Started Example",
    "version": "1.0",
    "description": "Build an Extension!",
    "permissions": ["storage"],
    "background": {
        "scripts": ["background.js"],
        "persistent": false
    },
    "manifest_version": 2
}
```

现在刷新插件，会多出来一个``背景页``按钮，点击可以看到后台代码打出的log："The color is green."。

## 实现用户接口

插件可以有很多形式的用户接口，本插件将用到popup(弹出式页面)。创建文件``popup.html``，包含如下代码，用于显示一个按钮用于点击来更改背景色：

``` html
<!DOCTYPE html>
  <html>
    <head>
      <style>
        button {
          height: 30px;
          width: 30px;
          outline: none;
        }
      </style>
    </head>
    <body>
        <button id="changeColor"></button>
    </body>
</html>
```

现在在manifest的page_action属性中声明这个文件作为弹出页面：

``` json
{
    "name": "Getting Started Example",
    "version": "1.0",
    "description": "Build an Extension!",
    "permissions": ["storage"],
    "background": {
        "scripts": ["background.js"],
        "persistent": false
    },
    "page_action": {
        "default_popup": "popup.html"
    },
    "manifest_version": 2
}
```

然后继续配置插件的[图标](https://developer.chrome.com/extensions/examples/tutorials/get_started/images.zip)，其中page_action中的图标用于在右上角显示，外部的icons中的图标用于在插件管理页中显示：

```
{
    "name": "Getting Started Example",
    "version": "1.0",
    "description": "Build an Extension!",
    "permissions": ["storage"],
    "background": {
        "scripts": ["background.js"],
        "persistent": false
    },
    "page_action": {
        "default_popup": "popup.html",
        "default_icon": {
            "16": "images/get_started16.png",
            "32": "images/get_started32.png",
            "48": "images/get_started48.png",
            "128": "images/get_started128.png"
        }
    },
    "icons": {
        "16": "images/get_started16.png",
        "32": "images/get_started32.png",
        "48": "images/get_started48.png",
        "128": "images/get_started128.png"
    },
    "manifest_version": 2
}
```

如果现在重载插件，将会显示一个灰色图标，但没有任何功能。因为``manifest``中定义了``page_actions``，将由插件来告诉浏览器用户合适可以和``popup.html交互``。

现在在后台脚本中添加新功能：

``` javascript
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({color: '#3aa757'}, function() {
      console.log('The color is green.');
    });
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
                conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {hostEquals: 'developer.chrome.com'},
            })
            ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});
```

现在插件将需要``declarativeContent``权限：

``` json
{
    "name": "Getting Started Example",
    ...
    "permissions": ["declarativeContent", "storage"],
    ...
}
```

现在当用户在``developer.chrome.com``站内时插件将变成正常彩色图标，，点击时将弹出``popup.html``页面。

弹出页面的最后一步是添加按钮颜色。创建页面脚本``popup.js``：

``` javascript
let changeColor = document.getElementById('changeColor');

chrome.storage.sync.get('color', function(data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
});
```

做的事情是从存储中获取颜色并设置。现在在popup.html中添加这个脚本：

``` html
<!DOCTYPE html>
<html>
    ...
    <body>
        <button id="changeColor"></button>
        <script src="popup.js"></script>
    </body>
</html>
```

重载插件你将看到一个绿色按钮。

## Layer Logic

插件现在知道了弹出层要当用户在``developer.chrome.com``站内时可用，并显示一个有颜色的按钮，但还需要进一步的用户交互。更新``popup.js``：

``` javascript
let changeColor = document.getElementById('changeColor');
...
changeColor.onclick = function(element) {
    let color = element.target.value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'document.body.style.backgroundColor = "' + color + '";'});
    });
};
```

更新的代码添加了一个点击事件到按钮，将会出发一个动态注入脚本。这将把页面的背景色设为跟按钮颜色相同。使用程序注入允许用户手动触发内容脚本，而不是添加不想要的代码到web页面中。

manifest中需要添加``activeTab``权限来允许插件临时访问``tabs``接口，以允许插件调用``tabs.executeScript``方法。

本插件现在可用了！重载插件，刷新页面，打开popup并点击按钮来把页面变绿！然而，有些用户可能想要将背景色更改为不同的颜色。

## 给用户选项

插件现在只允许用户更改背景色为绿色。

创建``options.html``页面包含如下代码：

``` html
<!DOCTYPE html>
<html>
    <head>
    <style>
        button {
        height: 30px;
        width: 30px;
        outline: none;
        margin: 10px;
        }
    </style>
    </head>
    <body>
        <div id="buttonDiv">
        </div>
        <div>
            <p>Choose a different background color!</p>
        </div>
    </body>
    <script src="options.js"></script>
</html>
```

并在manifest中配置这个选项页面：

``` json
{
    "name": "Getting Started Example",
    ...
    "options_page": "options.html",
    ...
    "manifest_version": 2
}
```

重载插件并点击``详细信息``，点击``扩展程序选项``即可看到这个页面。现在添加``options.js``包含如下内容：

``` javascript
let page = document.getElementById('buttonDiv');
const kButtonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1'];
function constructOptions(kButtonColors) {
    for (let item of kButtonColors) {
    let button = document.createElement('button');
    button.style.backgroundColor = item;
    button.addEventListener('click', function() {
        chrome.storage.sync.set({color: item}, function() {
        console.log('color is ' + item);
        })
    });
    page.appendChild(button);
    }
}
constructOptions(kButtonColors);
```

现在有四种颜色可选了。这几个页面都共享保存在插件全局storage中的颜色值。


