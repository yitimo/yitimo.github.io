---
layout: post
title:  【翻译】第一章：bash基础 - Learning the bash shell
date:   2019-03-18 18:09:13 +0800
author: yitimo
categories: bash-shell
tags: ["bash shell", "translation"]
keywords:
- bash shell,
- translation,
description: Translation for <Learning the bash shell.Chapter 01>.
---

七十年代早期，从UNIX系统诞生开始，它就变得越来越流行了。这段时间它已经发展出了不同的分枝版本，比如Ultrix，AIX，Xenix，SunOS以及Linux。从小型计算机和主机开始，它转移向了桌面工作站甚至是工作或家庭使用的个人电脑。不再局限于学术和计算机专业的大学和研究机构，UNIX也在许多商业、学校和家庭中使用了。随着时间推移，还有更多人会开始于UNIX接触。

你可能在学校、办公室、家里使用过UNIX来运行你的应用程序，打印文档或者阅读电子邮件。但是你有没有想过当你输入指令并按下回车时它都做了什么处理？

当你输入一个命令后，多个层级的事情将会发生，但我们只会考虑顶层，也就是shell。通常来说，shell就是任何用户之于UNIX操作系统的接口，比如，任何程序都由用户来输入，并翻译成程序能理解的语言，然后由操作系统再反馈回用户。图1-1展示了用户、shell和操作系统之间的关系：

![Figure 1-1. The shell is a layer around the UNIX operating system](/assets/images/201903/ch01-01.png)

有许多种用户接口，而bash是已知的基于字符输入的最常用的一种。这些接口接收用户输入的文字命令行，通常也产生文字输出。还有其他用户接口，包括越来越通用的图形用户接口，支持显示各种图形(而不仅仅是文字)输出，支持鼠标或其他触控设备的输入(比如一些银行语音机器)。

## shell是什么

shell的工作是将用户输入的命令行翻译成计算机指令。比如说，下面这行命令：

``` shell
sort -n phonelist > phonelist.sorted
```

其意思是，**按数字顺序排序文件phonelist中的每一行，结果输出到phonelist.sorted中**，shell做的事情如下：

1. 拆分命令为``sort``、``-n``、``phonelist``、``>``、``phonelist.sorted``这几个片段，称为``words``。
2. 查明``words``的目的，``sort``是个命令，``-n``和``phonelist``是参数，``>``和``phonelist.sorted``则是IO指令。
3. 根据``> phonelist.sorted (输出到文件phonelist. sorted)``来设置IO以及一些标准的内置命令。
4. 在一个文件中找到``sort``命令，并传入``-n``和``phonelist``来运行它。

当然，上述每一步都还包含一些子步骤，子步骤各自还可能包含一些操作系统层面的命令。

要记住shell本身并不是UNIX——仅仅是它的用户接口。UNIX是第一个将用户接口独立于操作系统的操作系统之一。

## 本书范围

本书你将学习到bash，是最新且强大的UNIX的shell之一。有两种方式来使用bash：作为用户接口以及作为编程环境。本章和下一章将涵盖交互使用，这两张可以给到你完整的背景知识来自信和高效地进行bash的日常使用。

当你使用了shell一段时间，你将毫无疑问的意识到想要更改一些你的环境独特的特性，以及定制一些自动化任务，第三章将会介绍这方面的一些方法。

第三章同时还会为shell编程做准备。第4到6章会着重讲到这方面。你不需要有任何编程经验来理解这些章节以及学习shell编程。第7、8两章会更详细的描述shell的IO和进程处理能力。而第9章将探讨几种调试技术。

通过本书你将学习到许多bash知识，同时还有UNIX的实用能力和UNIX操作系统通常的工作方式细节。让你可以即使没有编程经验也能编程shell编程的演奏家。同时，我们会避免过深的介绍UNIX内核细节，来做到你不需要是UNIX内核的专家也能有效的使用shell，同时我们也不会驻留在极少数底层系统编程相关的shell特性上。

## UNIX shell历史

shell脱离于UNIX操作系统本身帮助了shell的随着UNIX演变历史而茁壮成长，尽管只有极少数shell得到了广泛使用。

第一个主流的shell是Bourne shell，名字来源于其发明者Steven Bourne。它被包含在UNIX的第一个流行起来的版本，版本7，开始于1979年。Bourne shell在系统中就是``sh``。尽管UNIX已经产生了许多变化，Bourne shell仍然是一直流行未改变的的。一些UNIX的工具集和管理员特性都依赖于它。

第一个广泛使用的替代的shell就是C shell，或叫做csh。由Bill Joy在the University of California at Berkeley所写，作为Berkeley Software Distribution (BSD)版本的UNIX的一部分，在7版本发布几年后。

C shell取名自它本身的命令语法与C语言相似，这使UNIX程序员更容易去学习。它支持许多操作系统特性，比如任务控制(第八章讲到)，这在当时是BSD UNIX独有的，但现在大多数其他版本也都有了。它同时还有一些重要特性(比如别名，第三章讲到)，来使其更容易使用。

近几年还有许多其他shell都流行起来了。最值得一提的就是Korn shell，它是收录了sh和csh特性并含有自己特性的商业版本。ksh在许多方面都与bash相似。都包含有大量方便工作的特性。bash的优势是它是免费的。附录A胡讲到更多有关ksh的信息。

## Bourne Again Shell

bash名字来源于再次致敬Steve Bourne的shell，为了用于GNU项目而被创建。GNU项目由Free Software Foundation的Richard Stallman开启，目的是为了创建UNIX兼容的操作系统，并且将所有商业工具集替换为免费版本。GNU不仅象征着免费软件工具集，还有新的发布概念：the copyleft(版权所有)。版权所有的软件可以是免费发行的，只要没有进一步发行的限制(比如说，源码必须是免费可获取的)。

bash，预期是成为GNU系统的标准shell，正式诞生于Sunday, January 10, 1988。Brian Fox编写了bash的原始版本，和readline，以及继续强化shell直到1993年。早在1989年他就加入了Chet Ramey，负责许多bug修复和许多有用特性的维护。Chet Ramey现在是bash的官方维护者并持续强化它。

为了遵守GNU原则，从0.99开始的所有bash版本都可以从FSF免费获取。bash已经找到了方式在每个UNIX主版本之上，并迅速成为最受欢迎的Bourne shell派生shell。它是Linux的标准shell，并在免费UNIX操作系统以及苹果OS X中广泛使用。

1995年Chet Ramey开始在新的发行版本2.0上工作(首次发布于December 23, 1996)。bash 2.0添加了一系列新特性，并使shell采纳更多标准。bash 3.0强化了前一版本，并收入了一些特性和标准的采纳。

本书描述了bash 3.0。对于以前版本的bash也是适用的，任何当前版本新增的特性，或不同的地方都会指出。

## bash特性

尽管Bourne shell仍被认为是标准shell，bash已经越来越流行了。除了其与Bourne shell相近之外，它还包含了C shell和 Korn shell的特性，还有自己独有的特性。

bash的命令行编辑模式首先就吸引了人们。有了命令行编辑，回到和修改之前的命令比C shell的history mechanism更简单了，而Bourne shell压根做不到这些。bash的另一个受欢迎的主要特性是工作控制(job control)。如第八章所描述的，工作控制让你可以同时停止、开始和暂停任意数量的命令。这一特性主要借鉴自C shell。

bash剩余的主要优势主要对shell的定制和shell编程有意义。它有许多用于定制的新选项和变量。它的编程特性明显包含了函数定义，更多的控制结构，整型计算，更高级的IO控制等等。

## 获取bash

你现在可能没有在使用bash，你的系统管理员可能给你设置了各种shell作为系统的标准shell。甚至你可能还没意识到你的系统中存在不止一种shell。

查明你正在使用哪种shell很简单。登录你的系统并输入``echo $SHELL``。你可能会看到的响应比如``sh, csh, ksh, 或者 bash``。

如果你没有在使用bash而你想要使用，你首先要确定系统中是否存在bash。只需要输入``bash``。如果马上切换到了一些信息带上一个``$``符号，则表示一切正常。输入``exit``可以回到你原来的shell。

如果你得到了``not founc``这样的信息，你的系统可能并没有安装bash。告诉你的系统管理员或其他专业人员。也有可能你安装了多个版本的bash在你不知道的路径下，你可以在第十一章了解到如何取得你的bash版本。

当你知道了你的系统中存在bash，你可以在其他shell的任何地方输入``bash``来切换。当然，更好的是让你登录时就默认使用bash。你可能会自己来安装。

*待完成*



