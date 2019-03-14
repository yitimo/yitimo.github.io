---
layout: post
title:  【翻译】What are extensions?
date:   2019-03-14 09:58:13 +0800
author: yitimo
categories: ChromeExtension
tags: ["chrome extension", "translation"]
keywords:
- chrome extension,
- translation,
description: Translation for <What are extensions?>.
---

原文链接：[What are extensions?](https://developer.chrome.com/extensions)

Chrome插件(以下简称插件)是支持自定义浏览体验的小程序(基于Chrome浏览器)。它支持开发者功能性地裁剪Chrome的能力来实现个人需求或偏好。它基于web技术来实现，比如HTML，JavaScript，CSS。

一个插件必须被定义为实现某个明确的易于理解的具体目的。单个插件可以包含多个组建以及一系列功能，只要这一切都是用于实现某个共同目的。

用户接口(应用入口)需要是最小化的并且包含具体意图的。可以是一些简单的图标。*这里原文以 Google Mail Checker extension 的插件图标举例*。

插件文件被压缩在单个``.crx``后缀的应用程序包中来让用户下载安装。这意味着插件不依赖于web提供内容(而是下载内容到本地然后运行)。

插件通过[Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)来部署，并发布到[Chrome Web Store](http://chrome.google.com/webstore)，更多关于发布的信息请前往[store developer documentation](http://code.google.com/chrome/webstore)。

## Hello Extensions

现在通过一个快速起步项目来体验插件。先创建一个新的目录来存放插件的文件，或直接下载[示例项目](https://developer.chrome.com/extensions/samples#search:hello)。**这里其实只要准备一个传统的web项目即可，可以简单到只有一个包含最简单内容的index.html**。

下一步，添加一个文件名为``manifest.json``，内容如下：

```
{
    "name": "Hello Extensions",
    "description" : "Base Level Extension",
    "version": "1.0",
    "manifest_version": 2,
    "browser_action": {
        "default_popup": "hello.html",
        "default_icon": "hello_extensions.png"
    }
}
```

每一个插件都需要一个manifest文件，尽管大多数插件都不会在这个文件中做太多事情。对于这个起步项目，此文件的``browser_action``字段中定义了此插件包含的一个默认弹出页面和默认图标。

下载 [hello_extensions.png](https://developer.chrome.com/static/images/index/hello_extensions.png) 并创建``hello.html``：

```
<html>
    <body>
      <h1>Hello Extensions</h1>
    </body>
</html>
```

现在点击插件图标将会显示这个 ``hello.html`` 页面。下一步是添加一个快捷键命令，这一步不是必要的，但是很有趣：

```
{
    "name": "Hello Extensions",
    "description" : "Base Level Extension",
    "version": "1.0",
    "manifest_version": 2,
    "browser_action": {
        "default_popup": "hello.html",
        "default_icon": "hello_extensions.png"
    },
    "commands": {
        "_execute_browser_action": {
            "suggested_key": {
                "default": "Ctrl+Shift+F",
                "mac": "MacCtrl+Shift+F"
            },
            "description": "Opens hello.html"
        }
    }
}
```

最后一步是在本地安装这个插件：

1. 在 Chrome 中跳转到 ``chrome://extensions``，你也可以直接点击``浏览器右上角 -> 更多工具 -> 扩展程序``。
2. 开启此页面右上角的``开发者模式``。
3. 点击 ``加载已解压的扩展程序`` 并选择这个插件项目所在目录。

恭喜！你现在可以使用你这个基于弹出页面的插件了，只需点击右上角的插件图标或者使用快捷键``Ctrl+Shift+F``。
