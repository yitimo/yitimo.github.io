---
layout: post
title:  动态创建angular组件实现popup弹窗(下)
date:   2018-01-26 16:58:23 +0800
author: yitimo
categories: jekyll update
tags: ["angular"]
keywords:
- angular,
- angular dynamic component,
- popup
description: 参考 @angular/material 实现的动态弹窗组件
---
承接[上文](/jekyll/update/2018/01/26/angular-dynamic-popup-component.html)，本文将从一个基本的angular启动项目开始搭建一个具有基本功能、较通用、低耦合、可扩展的popup弹窗(脸红)，主要分为以下几步:
1. 基本项目结构搭建
2. 弹窗服务
3. 弹窗的引用对象
4. 准备作为模板的弹窗组件
5. 使用方法
### 基本项目结构
因为打算将我们的popup弹窗设计为在npm托管的包，以便其他项目可以下载并使用，所以我们的启动项目大概包含如下结构:
* package.json // 定义包的基本信息，包括名字、版本号、依赖等
* tsconfig.json // angular项目基于typescript进行搭建，需要此文件来指定ts的编译规则
* ... // tslint等一些帮助开发的配置文件
* index.ts // 放在根目录，导出需要导出的模块、服务等
* /src // 实际模块的实现
  * /src/module.ts // 模块的定义
  * /src/service.ts // 弹窗服务
  * /src/templates/* // 作为模板的组件
  * /src/popup.ref.ts // 对创建好的组件引用的封装对象
  * /src/animations.ts // 动画的配置

现在我们只来关心src目录下的实现。
### 弹窗服务
弹窗服务的职责是提供一个叫做open的方法，用来创建出组件并显示，还得对创建好的组件进行良好的控制:
``` javascript
import { Injectable, ApplicationRef, ComponentFactoryResolver,
    ComponentRef, EmbeddedViewRef } from '@angular/core';
import { YupRef, ComponentType } from './popup.ref';

@Injectable()
export class DialogService {
    private loadRef: YupRef<LoadComponent>;
    constructor(
        private appRef: ApplicationRef,
        private compFactRes: ComponentFactoryResolver
    ) {}
    // 创建一个组件，组件通过泛型传入以做到通用
    public open<T>(component: ComponentType<T>, config: any) {
        // 创建组件工厂
        const factory = this.compFactRes.resolveComponentFactory(component);
        // 创建一个新的弹窗引用
        const dialogRef = new YupRef(factory, config);
        // 将创建好的组件引用(由弹窗引用创建并返回)append到body标签下
        window.document.body.appendChild(this.getComponentRootNode(dialogRef.componentRef()));
        // 加入angular脏检查
        this.appRef.attachView(dialogRef.componentRef().hostView);
        // 将创建的弹窗引用返回给外界
        return dialogRef;
    }
    // 参考自Material2，将ComponentRef类型的组件引用转换为DOM节点
    private getComponentRootNode(componentRef: ComponentRef<any>): HTMLElement {
        return (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
    }
}

// 参考自Material2 用于作为传入组件的类型
export interface ComponentType<T> {
    new (...args: any[]): T;
}
```
### 弹窗的引用对象
上面服务中的open方法实际上把创建组件的细节通过new一个YupRef即弹窗引用来实现，这是因为考虑到服务本身是单例，如果仅使用open方法直接创建多个弹窗，在使用时会丢失除了最后一个弹窗外的控制能力，笔者这里采用的办法是将创建的弹窗封装成一个类即YupRef:
``` javascript
import { ComponentRef, InjectionToken, ReflectiveInjector, ComponentFactory } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
// 用于注入自定义数据到创建的组件中
export const YUP_DATA = new InjectionToken<any>('YUPPopupData');

export class YupRef<T> {
    // 弹窗关闭的订阅
    private afterClose$: Subject<any>;
    // 弹窗引用变量
    private dialogRef: ComponentRef<T>;
    constructor(
        private factory: ComponentFactory<T>,
        private config: any // 传入的自定义数据
    ) {
        this.afterClose$ = new Subject<any>();
        this.dialogRef = this.factory.create(
            ReflectiveInjector.resolveAndCreate([
                {provide: YUP_DATA, useValue: config}, // 注入自定义数据
                {provide: YupRef, useValue: this} // 注入自身，这样就可以在创建的组件里控制组件的关闭等
            ])
        );
    }
    // 提供给外界的对窗口关闭的订阅
    public afterClose(): Observable<any> {
        return this.afterClose$.asObservable();
    }
    // 关闭方法，将销毁组件
    public close(data?: any) {
        this.afterClose$.next(data);
        this.afterClose$.complete();
        this.dialogRef.destroy();
    }
    // 提供给弹窗服务以帮助添加到DOM中
    public componentRef() {
        return this.dialogRef;
    }
}
```
这样一来每次调用open方法后都能得到一个YupRef对象，提供了关闭方法以及对关闭事件的订阅方法。
### 预制弹窗组件
弹窗服务中的open方法需要两个参数，第二个是传入的自定义数据，第一个就是需要创建的组件了，现在我们创建出几个预制组件，以dialog.component为例: 
``` javascript
import { Component, Injector } from '@angular/core';
import { YupRef, YUP_DATA } from '../popup.ref';
import { mask, dialog } from '../animations';

@Component({
    template: `
    <div class="yup-mask" [@mask]="disp" (click)="!data?.mask && close(false)"></div>
    <div class="yup-body" [@dialog]="disp">
        <div class="yup-body-head">{{data?.title || '消息'}}</div>
        <div class="yup-body-content">{{data?.msg || ' '}}</div>
        <div class="yup-body-btns">
            <div class="btn default" (click)="close(false)">{{data?.no || '取消'}}</div>
            <div class="btn primary" (click)="close(true)">{{data?.ok || '确认'}}</div>
        </div>
    </div>
    `,
    styles: [`这里省略一堆样式`]
    animations: [mask, dialog]
})
export class DialogComponent {
    public data: {
        title?: string,
        msg?: string,
        ok?: string,
        no?: string,
        mask?: string
    };
    public dialogRef: YupRef<DialogComponent>;
    public disp: string;
    constructor(
        private injector: Injector
    ) {
        this.data = this.injector.get(YUP_DATA);
        this.dialogRef = this.injector.get(YupRef);
        this.disp = 'init';
        setTimeout(() => {
            this.disp = 'on';
        });
    }
    public close(comfirm: boolean) {
        this.disp = 'off';
        setTimeout(() =>  {
            this.disp = 'init';
            this.dialogRef.close(comfirm);
        }, 300);
    }
}
```
用笔者这种方式创建的组件有两个尴尬的小问题:
* 不能使用隐式的依赖注入了，必须注入Injector服务来手动get到注入的两个依赖，即代码中的
 this.injector.get(YUP_DATA) 和 this.injector.get(YupRef) 。
* 直接使用angular动画会失效，因为是暴力添加到DOM中的方式，必须手动setTimeout过等动画结束再真正销毁组件。

创建好组件后再服务中添加快捷创建此组件的方法:
``` javascript
public dialog(config: {
    title?: string,
    msg?: string,
    ok?: string,
    no?: string,
    mask?: boolean
}) {
    return this.open(DialogComponent, config);
}
```
额外需要提一点是虽然这样创建的组件没有被一开始就添加到页面中，仍然需要在所属模块的declaration中声明，并且还得在entryComponent中声明过，否则angular就会通过报错的方式让你这么做，就像下面这个弹窗模块的定义这样:
``` javascript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent, AlertComponent, ToastComponent, LoadComponent } from './templates';
import { DialogService } from './service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
    declarations: [DialogComponent, AlertComponent, ToastComponent, LoadComponent],
    imports: [ NoopAnimationsModule, CommonModule ],
    exports: [],
    providers: [DialogService],
    entryComponents: [DialogComponent, AlertComponent, ToastComponent, LoadComponent]
})
export class YupModule {}
```
而此弹窗模块真正需要导出的东西有4个，都列在index.ts中: 
``` javascript
export { YupModule } from './module'; // 需要在AppModule中引入
export { DialogService as Yup } from './service'; // 用于发起弹窗
export { YupRef, YUP_DATA } from './popup.ref'; // 用于创建自定义弹窗时提供控制
```
### 使用方法
最终在外界的使用方式如下:
``` javascript
constructor(
    public yup: Yup // 其实是DialogService，被笔者改了名
) { }

public ngOnInit() {
    this.yup.dialog({msg: '弹不弹?', title: '我弹', ok: '弹弹', no: '别弹了', mask: true}).afterClose().subscribe((res) => {
        if (res) {
            console.log('点击了确定');
        } else {
            console.log('点击了取消');
        }
    });
}
```
当不想使用预制的弹窗组件时，大可以自行创建好一个组件，然后使用open方法:
``` javascript
this.yup.open(CustomComponent, '我是自定义数据').afterClose().subscribe((res) => {
    console.log(`我已经被关闭了，不过我能携带出来数据: 【${res}】`);
});
```
乍一看是不是有点接近Material2的Dialog的使用呢  :) ，不过[来自Google Inc的Material2版究极Dialog模块](https://material.angular.io/components/dialog/overview)做了极变态的抽象以及组件嵌套，推荐勇士前去研究。

详细的源代码笔者托管在[Github](https://github.com/yitimo/yeui/tree/master/src/yup)上，几个预制组件是参照weui的样式实现的。
