---
layout: post
title:  动态创建angular组件实现popup弹窗(上)
date:   2017-09-14 22:12:00 +0800
author: yitimo
categories: Angular
tags: ["angular"]
keywords:
- angular,
- angular dynamic component,
- popup
description: 参考 @angular/material 实现的动态弹窗组件
---
*笔者将用两篇文章来完成这个话题，本文将主要讲述自己使用过的弹窗的创建方法，以及为了彻底解耦，最终选择使用动态创建组件来完成如题所说的这个比较通用、低耦合、可扩展的弹窗能力*
### 起步: 直接使用ngIf
把弹窗的DOM直接放在页面底下隐藏，通过ngIf这样的指令控制其显示。
### 改进: 封装成angular模块，通过服务控制其显示
直接使用ngIf的话，让人不爽的地方就在于不够通用，每个页面都得加DOM。改进的话可以把比较通用的一些DOM封装成组件，统一添加到全局页面中，并将显示的控制交给一个angular服务来控制其显示。
比如定义了两个组件(DialogComponent, AlertComponent)，将他们都添加到AppComponent下，然后提供一个PopupService来控制组件的显示，并支持传递参数进去。
### 仅通过控制显示的方式仍不够通用且存在耦合
将弹窗组件封装然后使用服务来控制显示的方法看上去已经比较通用了，不过还存在两个尴尬的问题: 
1. 仍然需要在页面的某个地方放置一个弹窗组件，比如叫做PopupComponent，此组件负责渲染出默认隐藏的一些通用弹窗子组件，才能进行显示控制实现弹窗能力。
2. 如果想要弹出一个自定义窗口的话就只能回到最上面另外写DOM放到需要弹出自定义弹窗的位置上，或者将自定义的标签通过innerHtml指令传入(富文本方式)。

由此可见这样的弹窗能力并没有做到非常通用，且必须手动放置弹窗插座(姑且这么叫)以致多了一处耦合。
### 动态创建弹窗
最理想的方式应该是: 在想要弹个窗口出来时直接一行代码把窗口弹出来，不用事先在哪里先把这个弹窗写好(或者说这一步不应该由弹窗控件的使用者来做，弹窗控件应该要自动完成这件事)。
而这一能力就涉及到angular的动态创建组件的能力了。
#### 官网给出的用法
[angular的官方文档](https://angular.cn/guide/dynamic-component-loader)中就有关于动态创建组件的用法。不过其使用的是ViewContainerRef服务，此服务提供了createComponent方法来在指定的视图容器下动态创建一个组件出来。
不过ViewContainerRef的尴尬点是只能在具体的指令、组件中使用，也就是说，必须告诉它打算在哪个地方创建新组建，这不还是需要实现创建好一个“弹窗插座”出来，才可以在这个“插座”中动态创建组件。
那有什么办法可以不给定视图容器而创建出组建来，通俗地讲问题就是: 不是在指令或者组件中创建组件，而是在服务中创建出组件，还要让这个组件显示到页面上去。
#### 组建工厂——组件真正的创建者
在组件中创建组件的核心代码分两步:
1. 创建组件工厂
``` javascript
let componentFactory = this.componentFactoryResolver.resolveComponentFactory(待创建组件);
```
2. 把工厂提供给容器创建出组件
``` javascript
let componentRef = viewContainerRef.createComponent(componentFactory);
```
现在的问题在于，在服务中得不到viewContainerRef，工厂倒是能创建成功。
其实有工厂了已经足够了，查看componentFactory提供的成员里面包含了一个create方法，顾名思义这应该就是用来创建组件的了。
create方法有个必选参数类型为Injector，顾名思义就是注入器，即这个创建的组件打算注入些什么服务进去，暴力点直接写null也没问题。
直接使用工厂创建组件返回的同样是一个ComponentRef类型的引用，可见此时组件确实是创建出来了，但是还没有将其插入到视图中去。此时可以再暴力一点，直接用原生DOM操作插入到body标签的末尾去: 
``` javascript
window.document.body.appendChild(
    this.getComponentRootNode(componentRef)
);
this.appRef.attachView(componentRef); // 注入ApplicationRef服务后使用
// ...
private getComponentRootNode(componentRef: ComponentRef<any>): HTMLElement {
    return (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
}
// ...
```
此办法是笔者从Material2的茫茫源代码中找到的，Google自己都直接这么插，那就放心使用了。这里不得不赞叹Material2中Dialog模块的实现，实在是有够复杂。
### 总结
本文主要在讲思路，扯到最后才开始要进入主题来动态创建组件，不过仅仅是创建出组件并添加到DOM中去还只是第一步，一个健壮的弹窗模块(Material2那样的)还得有一套完善的交互能力，比如弹出和关闭时的订阅和传值，这些就要通过注入服务到组件中来实现了，限于篇幅将在 [下一篇文章](/jekyll/update/2017/09/15/angular-dynamic-popup-component-2.html) 中回归实际实现一个通过动态创建组件实现的弹窗模块出来。
