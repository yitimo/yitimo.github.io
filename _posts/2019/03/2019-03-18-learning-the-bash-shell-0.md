---
layout: post
title:  【翻译】序 - Learning the bash shell
date:   2019-03-18 15:12:13 +0800
author: yitimo
categories: bash-shell
tags: ["bash shell", "translation"]
keywords:
- bash shell,
- translation,
description: Translation for <Learning the bash shell.Perface>.
---

对于Linux/Unix操作系统来说，首先与用户面对面的就是shell。``Shell``是属于Unix系统的用户接口(User Interface)——用来让你通过键盘和显示来与电脑交互。Shell只是囊括了系统的许多单独的程序，因此，其实还可以有很多别的选择。

系统通常会给新用户无条件设置好一个“标准”的shell。然而，这些自带的shell可能会比较旧，且缺失一些新特性。这很遗憾，因为shell可以说承载了你得整个工作环境。由于更改shell就像换一顶帽子那样简单，我们没有理由不改用最新最强大的shell。

跟多数shell的选择一样，本书介绍的是``Bourne Again shell``(简称``bash``)，一个现代的多功能shell。还有其他有用的现代shell比如``Korn shell (ksh)``，``Tenex C shell (tcsh)``。

## bash版本

本书将涉及到bash的所有版本，尽管旧版的bash会缺失一些新版才有的特性。你可以通过输入``echo $BASH_VERSION``来很轻松的知道自己在使用的bash版本。bash最早的公布版本是``1.0``，最新的是``3.0``(于2004年七月发行)。如果你的版本是较旧的，你可能会想要更新到最新版本，第12章会讲到如何去做。

## bash特性总览

bash向后兼容，继承演变自Bourne shell。包含了C shell的大多数长处，Korn shell的一些特性，以及自己特有的一些新特性。
与C shell同有的特性包括：

* 通过pushd、popd、dirs命令的目录管理。
* 工作控制，包含fg、bg命令，以及可以通过ctrl+z终止工作的能力。
* 花括号扩展，用于生成更灵活的字符串。
* 波浪号扩展，一个快速引用路径的方式。
* 别名，允许你定义快捷命令来执行多个或多行命令。
* 命令历史，允许你再次调用之前执行过的命令。

bash主要的新特性包括：

* 命令行编辑，允许你编辑使用vi或emacs风格的命令行。
* 按键绑定，允许你自定义按钮序列。
* 整体代码特性，多个扩展的UNIX命令，包括test、expr、getopt、echo都被整合进了shell当中，可以更干净高效的执行常用的代码。
* 控制结构，尤其是select结构，允许简单菜单的生成。
* 新选项和变量，给了你更多定制环境的方式。
* 一维数组，允许简单的引用和管理数据列表。
* 动态加载的内置插件，允许你自行编写并加载到正在运行的shell中。

## 目标读者

*先省略*

## 代码示例

*先省略*

## 章节总览

如果你想要查找指定章节而不是通读本书，以下就是章节总览：

* **第一章：bash基础** 介绍bash，告诉你如何安装(当登录到shell时)。然后是与bash交互的基础，包括了UNIX文件目录体系、标准IO、后台任务的总览。
* **第二章：命令行编辑** 探讨shell的命令历史的机制(包括emacs和vi模式)，历史替换，fc命令，以及readline和bind的键位绑定。
* **第三章：定制你的环境** 包含定制你得shell环境的方法，使用启动环境文件而不是编程方式。别名、选项以及shell变量就是定制技术要探讨的内容。
* **第四章：shell编程基础** 介绍了shell编程。解释了shell脚本和函数的基础，探讨几个重要的具体(nuts-and-bolts)的编程特性：字符串操作符，大括号扩展，命令行参数和命令替换。
* **第五章：流控制** 继续对shell编程的讨论。解释命令退出状态，条件表达式，以及shell的流控制结构：if、for、case、select、while以及until。
* **第六章：命令行选项和类型变量** 深入位置参数和命令行选项处理，然后探讨特殊类型和属性的变量，整型计算和数组。
* **第七章：输入/输出和命令行处理** 详细介绍bash的IO，本章涵盖了shell的IO重定向，以及一次一行的IO命令read和echo。并且还探讨了shell的命令行处理机制和eval命令。
* **第八章：进程处理** 涵盖了进程相关问题的细节。从工作控制开始，然后进入到有关进程的几个低等级信息，包括进程ID，sign和trap。然后还会探讨更高级的概念，协程和子shell。
* **第九章：shell编程调试** 一些调试技术，像trace和verbose模式。假的进程标识。然后是一个有用的shell调试工具的细节(a bash debugger)。
* **第十章：bash管理员** 介绍系统管理员的信息，包含了实现系统层面的shell以及定制系统安全相关特性的技术。
* **第十一章：shell脚本** 介绍让shell脚本更加可维护的方法。
* **第十二章：你系统中的shell** 如何获取bash以及如何安装到你的系统中，还概括了一些问题的处理。

## 本书中的约定

*先省略*

## 后续小结均先省略，优先翻译实际技术讲解相关的内容。
