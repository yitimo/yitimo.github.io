---
layout: post
title:  从源码看 angular/material2 中 dialog模块 的实现
date:   2017-10-16 11:02:00 +0800
author: yitimo
categories: Angular
tags: ["angular"]
keywords:
- angular,
- material,
- angular source code
description: 从源码研究@angular/material中MatDialog弹窗模块的实现
---
本文将探讨material2中popup弹窗即其Dialog模块的实现。

## 使用方法
1. 引入弹窗模块
2. 自己准备作为模板的弹窗内容组件
3. 在需要使用的组件内注入 ``MatDialog`` 服务
4. 调用 ``open`` 方法创建弹窗，并支持传入配置、数据，以及对关闭事件的订阅

## 深入源码
进入material2的源码，先从 ``MatDialog`` 的代码入手，找到这个 ``open`` 方法:

``` typescript
open<T>(
    componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    config?: MatDialogConfig
): MatDialogRef<T> {
    // 防止重复打开
    const inProgressDialog = this.openDialogs.find(dialog => dialog._isAnimating());
    if (inProgressDialog) {
      return inProgressDialog;
    }
    // 组合配置
    config = _applyConfigDefaults(config);
    // 防止id冲突
    if (config.id && this.getDialogById(config.id)) {
      throw Error(`Dialog with id "${config.id}" exists already. The dialog id must be unique.`);
    }
    // 第一步：创建弹出层
    const overlayRef = this._createOverlay(config);
    // 第二步：在弹出层上添加弹窗容器
    const dialogContainer = this._attachDialogContainer(overlayRef, config);
    // 第三步：把传入的组件添加到创建的弹出层中创建的弹窗容器中
    const dialogRef = this._attachDialogContent(componentOrTemplateRef, dialogContainer, overlayRef, config);
    // 首次弹窗要添加键盘监听
    if (!this.openDialogs.length) {
      document.addEventListener('keydown', this._boundKeydown);
    }
    // 添加进队列
    this.openDialogs.push(dialogRef);
    // 默认添加一个关闭的订阅 关闭时要移除此弹窗
    // 当是最后一个弹窗时触发全部关闭的订阅并移除键盘监听
    dialogRef.afterClosed().subscribe(() => this._removeOpenDialog(dialogRef));
    // 触发打开的订阅
    this.afterOpen.next(dialogRef);
    return dialogRef;
}
```

总体看来弹窗的发起分为三部曲:

1. 创建一个弹出层(其实是一个原生DOM，起宿主和入口的作用)
2. 在弹出层上创建弹窗容器组件(负责提供遮罩和弹出动画)
3. 在弹窗容器中创建传入的弹窗内容组件(负责提供内容)

### 弹出层的创建
对于其他组件，仅仅封装模板以及内部实现就足够了，最多还要增加与父组件的数据、事件交互，所有这些事情，单使用angular Component就足够实现了，在何处使用就将组件选择器放到哪里去完事。

但对于弹窗组件，事先并不知道会在何处使用，因此不适合实现为一个组件后通过选择器安放到页面的某处，而应该将其作为弹窗插座放置到全局，并通过服务来调用。

material2也要面临这个问题，这个弹窗插座是避免不了的，那就在内部实现它，在实际调用弹窗方法时动态创建这个插座就可以了。要实现效果是：对用户来说只是在单纯调用一个 ``open`` 方法，由material2内部来创建一个弹出层，并在这个弹出层上创建弹窗。

找到弹出层的创建代码如下:

``` typescript
create(config: OverlayConfig = defaultConfig): OverlayRef {
    const pane = this._createPaneElement(); // 弹出层DOM 将被添加到宿主DOM中
    const portalHost = this._createPortalHost(pane); // 宿主DOM 将被添加到<body>末端
    return new OverlayRef(portalHost, pane, config, this._ngZone); // 弹出层的引用
}
private _createPaneElement(): HTMLElement {
    let pane = document.createElement('div');
    pane.id = `cdk-overlay-${nextUniqueId++}`;
    pane.classList.add('cdk-overlay-pane');
    this._overlayContainer.getContainerElement().appendChild(pane); // 将创建好的带id的弹出层添加到宿主
    return pane;
}
private _createPortalHost(pane: HTMLElement): DomPortalHost {
    // 创建宿主
    return new DomPortalHost(pane, this._componentFactoryResolver, this._appRef, this._injector);
}
```

其中最关键的方法其实是 ``getContainerElement()`` , material2把最"丑"最不angular的操作放在了这里面，看看其实现:

``` typescript
getContainerElement(): HTMLElement {
    if (!this._containerElement) { this._createContainer(); }
    return this._containerElement;
}
protected _createContainer(): void {
    let container = document.createElement('div');
    container.classList.add('cdk-overlay-container');

    document.body.appendChild(container); // 在body下创建顶层的宿主 姑且称之为弹出层容器(OverlayContainer)
    this._containerElement = container;
}
```

### 弹窗容器的创建
跳过其他细节，现在得到了一个弹出层引用 ``overlayRef``。material2接下来给它添加了一个弹窗容器组件，这个组件是material2自己写的一个angular组件，打开弹窗时的遮罩部分以及弹窗的外轮廓其实就是这个组件，对于为何要再套这么一层容器，有其一些考虑。

1. 动画效果的保护
这样动态创建的组件有一个缺点，那就是其销毁是无法触发angular动画的，因为一瞬间就销毁掉了，所以material2为了实现动画效果，多加了这么一个容器来实现动画，在关闭弹窗时，实际上是在播放弹窗的关闭动画，然后监听容器的动画状态事件，在完成关闭动画后才执行销毁弹窗的一系列代码，这个过程与其为难用户来实现，不如自己给封装了。

2. 注入服务的保护
目前版本的angular关于在动态创建的组件中注入服务还存在一个注意点，就是直接创建出的组件无法使用隐式的依赖注入，也就是说，直接在组件的 ``constructor`` 中声明服务对象的实例是不起作用的，而必须先注入 ``Injector`` ，再使用这个 ``Injector`` 把注入的服务都 ``get`` 出来:

``` typescript
private 服务;
constructor(
    private injector: Injector
    // private 服务: 服务类 // 这样是无效的
) {
    this.服务 = injector.get('服务类名');
}
```

解决的办法是不直接创建出组件来注入服务，而是先创建一个指令，再在这个指令中创建组件并注入服务使用，这时隐式的依赖注入就又有效了，material2就是这么干的:

``` html
<ng-template cdkPortalHost></ng-template>
```

其中的 ``cdkPortalHost`` 指令就是用来后续创建组件的。
所以创建这么一个弹窗容器组件，用户就感觉不到这一点，很顺利的像普通组件一样注入服务并使用。

创建弹窗容器的核心方法在 ``dom-portal-host.ts`` 中:
``` typescript
attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    // 创建工厂
    let componentFactory = this._componentFactoryResolver.resolveComponentFactory(portal.component);
    let componentRef: ComponentRef<T>;
    if (portal.viewContainerRef) {
        componentRef = portal.viewContainerRef.createComponent(
            componentFactory,
            portal.viewContainerRef.length,
            portal.injector || portal.viewContainerRef.parentInjector);

        this.setDisposeFn(() => componentRef.destroy());
        // 暂不知道为何有指定宿主后面还要把它添加到宿主元素DOM中
    } else {
        componentRef = componentFactory.create(portal.injector || this._defaultInjector);
        this._appRef.attachView(componentRef.hostView);
        this.setDisposeFn(() => {
        this._appRef.detachView(componentRef.hostView);
            componentRef.destroy();
        });
        // 到这一步创建出了经angular处理的DOM
    }
    // 将创建的弹窗容器组件直接append到弹出层DOM中
    this._hostDomElement.appendChild(this._getComponentRootNode(componentRef));
    // 返回组件的引用
    return componentRef;
}
```

所做的事情无非就是动态创建组件的四步曲:

1. 创建工厂
2. 使用工厂创建组件
3. 将组件整合进AppRef(同时设置一个移除的方法)
4. 在DOM中插入这个组件的原始节点

### 弹窗内容

从上文可以知道，得到的弹窗容器组件中存在一个宿主指令，实际上是在这个宿主指令中创建弹窗内容组件。进入宿主指令的代码可以找到 ``attachComponentPortal`` 方法:

``` typescript
attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    portal.setAttachedHost(this);

    // If the portal specifies an origin, use that as the logical location of the component
    // in the application tree. Otherwise use the location of this PortalHost.
    // 如果入口已经有宿主则使用那个宿主
    // 否则使用 PortalHost 作为宿主
    let viewContainerRef = portal.viewContainerRef != null ?
        portal.viewContainerRef :
        this._viewContainerRef;
    // 在宿主上动态创建组件的代码
    let componentFactory = this._componentFactoryResolver.resolveComponentFactory(portal.component);
    let ref = viewContainerRef.createComponent( // 使用 ViewContainerRef 动态创建组件到当前视图容器(也就是弹窗容器指令)
        componentFactory, viewContainerRef.length,
        portal.injector || viewContainerRef.parentInjector
    );

    super.setDisposeFn(() => ref.destroy());
    this._portal = portal;

    return ref;
}
```

最后这一步就非常明了了，正是官方文档中使用的动态创建组件的方式(``ViewContainerRef``)，至此弹窗已经成功弹出到界面中了。

### 弹窗的关闭

还有最后一个要注意的点就是弹窗如何关闭，从上文可以知道应该要先执行关闭动画，然后才能销毁弹窗，material2的弹窗容器组件添加了一堆节点:

```
host: {
    'class': 'mat-dialog-container',
    'tabindex': '-1',
    '[attr.role]': '_config?.role',
    '[attr.aria-labelledby]': '_ariaLabelledBy',
    '[attr.aria-describedby]': '_config?.ariaDescribedBy || null',
    '[@slideDialog]': '_state',
    '(@slideDialog.start)': '_onAnimationStart($event)',
    '(@slideDialog.done)': '_onAnimationDone($event)',
}
```

其中需要关注的就是material2在容器组件中添加了一个动画叫 ``slideDialog`` ，并为其设置了动画事件，现在关注动画完成事件的回调:

``` typescript
_onAnimationDone(event: AnimationEvent) {
    if (event.toState === 'enter') {
        this._trapFocus();
    } else if (event.toState === 'exit') {
        this._restoreFocus();
    }
    this._animationStateChanged.emit(event);
    this._isAnimating = false;
}
```

这里发射了这个事件，并在 ``MatDialogRef`` 中订阅:

``` typescript
constructor(
    private _overlayRef: OverlayRef,
    private _containerInstance: MatDialogContainer,
    public readonly id: string = 'mat-dialog-' + (uniqueId++)
) {
    // 添加弹窗开启的订阅 这里的 RxChain 是material2自己对rxjs的工具类封装
    RxChain.from(_containerInstance._animationStateChanged)
    .call(filter, event => event.phaseName === 'done' && event.toState === 'enter')
    .call(first)
    .subscribe(() => {
        this._afterOpen.next();
        this._afterOpen.complete();
    });
    // 添加弹窗关闭的订阅，并且需要在收到回调后销毁弹窗
    RxChain.from(_containerInstance._animationStateChanged)
    .call(filter, event => event.phaseName === 'done' && event.toState === 'exit')
    .call(first)
    .subscribe(() => {
        this._overlayRef.dispose();
        this._afterClosed.next(this._result);
        this._afterClosed.complete();
        this.componentInstance = null!;
    });
}

/**
* 这个也就是实际使用时的关闭方法
* 所做的事情是添加beforeClose的订阅并执行 _startExitAnimation 以开始关闭动画
* 底层做的事是 改变了弹窗容器中 slideDialog 的状态值
*/
close(dialogResult?: any): void {
    this._result = dialogResult; // 把传入的结果赋值给私有变量 _result 以便在上面的 this._afterClosed.next(this._result) 中使用

    // Transition the backdrop in parallel to the dialog.
    RxChain.from(this._containerInstance._animationStateChanged)
    .call(filter, event => event.phaseName === 'start')
    .call(first)
    .subscribe(() => {
        this._beforeClose.next(dialogResult);
        this._beforeClose.complete();
        this._overlayRef.detachBackdrop();
    });

    this._containerInstance._startExitAnimation();
}
```

## 总结
以上就是整个material2 dialog能力走通的过程，可见即使是 angular 这么完善又庞大的框架，想要完美解耦封装弹窗能力也不能完全避免原生DOM操作。

除此之外给我的感觉还有——无论是angular还是material2，它们对TypeScript的使用都让我自叹不如，包括但不限于抽象类、泛型等装逼技巧，把它们的源码慢慢看下来，着实能学到不少东西。