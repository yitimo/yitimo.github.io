---
layout: post
title:  从源码理解angular项目在JIT模式下的启动过程
date:   2017-09-25 16:56:00 +0800
author: yitimo
categories: Angular
tags: ["angular"]
keywords:
- angular,
- angular source code
description: 个人研究angular(v4.3)源码，对其在JIT模式下的启动引导过程进行分析。
---
通常一个angular项目会有一个个模块(Module)来管理各自的业务，并且必须有一个根模块(AppModule)作为应用的入口模块，整个应用都围绕AppModule展开。可以这么说，AppModule是一个angular项目的起点。

不过单从angular的启动过程来说，AppModule就是其工作的终点。整个angular框架的启动过程都是为了使AppModule可以工作而展开的。本文算是笔者单就阅读angular源码中的启动过程相关部分的总结，angular源码博大精深，有任何笔者理解不够或错误的地方还望包涵并指正。

### 源码中的一些类与个人的翻译
在Typescript的帮助下angular框架实现了究极抽象，其中有几个固定风格的命名，笔者个人的翻译如下:
* XXX-Injector: 注入器 ( *也就是到处注入的服务实例* )
* XXX-Factory: 工厂 ( *包括了 编译器工厂、平台工厂、模块工厂、组建工厂等，所有这些类都由工厂创建出来* )
* XXX-Ref: 引用 ( *工厂创建出的所有类都是一个引用，通过引用来进行控制* )

### 启动过程的实现目标
首先不直接查看angular源代码，而是从实际项目的启动代码入手，一般的实际项目通过这样的代码启动:

``` javascript
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app';

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
```

根据涉及的两个方法的返回类型可以看出angular的启动整体来看分为两部曲:
1. 创建平台引用 platformBrowserDynamic()
2. 使用创建的平台引用进一步创建模块引用 bootstrapModule(AppModule)

接下来就要利用好TypeScript究极智能代码提示到处F12来进入angular的源代码了。

### 得到平台引用 PlatformRef
首先在 /packages/platform-browser-dynamic/src/platform-browser-dynamic.ts 下找到 platformBrowserDynamic 方法的定义:

``` javascript
// JIT下创建 平台工厂
export const platformBrowserDynamic = createPlatformFactory(
    platformCoreDynamic, 'browserDynamic', INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS);
```

可见 platformBrowserDynamic 本身是一个平台工厂，直接执行平台工厂就可以得到一个平台引用。

根据传入的参数可以得出，创建好的平台名称为 browserDynamic，注入了一个名字很长的服务，并且依赖一个父级工厂叫做 platformCoreDynamic。
进入 INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS 发现有意思的几个注入器如下:

``` javascript
{ // 传入的是一个资源加载器 内含一个get方法用来创建XmlHttpRequest对象请求资源
    provide: COMPILER_OPTIONS,
    useValue: {providers: [{provide: ResourceLoader, useClass: ResourceLoaderImpl}]},
    multi: true
},
{provide: PLATFORM_INITIALIZER, useValue: initDomAdapter, multi: true}, // 初始化DOM适配器 实例化一个类 包含所有DOM操作
{provide: PlatformLocation, useClass: BrowserPlatformLocation}, // 浏览器端定位服务 提供了一些从DOM中得到url、历史等信息的能力
{provide: DOCUMENT, useFactory: _document, deps: []}, // windows 的 document 对象
```

<hr />

进入父平台 platformCoreDynamic 的实现:

``` javascript
// 作为根平台工厂的父平台 这个也使用平台工厂创建，但其父平台为 核心平台
export const platformCoreDynamic = createPlatformFactory(platformCore, 'coreDynamic', [
  {provide: COMPILER_OPTIONS, useValue: {}, multi: true},
  {provide: CompilerFactory, useClass: JitCompilerFactory},
]);
```

这个平台表面上也没做什么厉害的事情，不就是注入了一个编译选项 COMPILER_OPTIONS，还是空的，以及一个看名字很厉害实际上更厉害的 JitCompilerFactory，直接翻译为JIT编译器工厂，那就是用来生成编译器的东西。

<hr />

然后继续往下进入爷爷平台 platformCore 的实现:

``` javascript
// 核心平台的服务商 比较厉害的就是 PlatformRef_
const _CORE_PLATFORM_PROVIDERS: Provider[] = [
  { provide: PLATFORM_ID, useValue: 'unknown' },   // 用于设置缺省平台名
  PlatformRef_, // 核心模块引用
  { provide: PlatformRef, useExisting: PlatformRef_ }, // 模块引用就是核心模块引用
  { provide: Reflector, useFactory: _reflector, deps: [] }, // Reflect待研究
  TestabilityRegistry, // 测试支持待研究
  Console, // 日志服务
];

// 核心工厂无父平台 就直接传null 命名为 core
export const platformCore = createPlatformFactory(null, 'core', _CORE_PLATFORM_PROVIDERS);
```

亲戚关系就到爷爷这里为止了，现在进入 createPlatformFactory 看看平台工厂是怎么创建的(不是创建平台，而是创建工厂):

``` javascript
export function createPlatformFactory(
    parentPlatformFactory: ((extraProviders?: Provider[]) => PlatformRef) | null, name: string, // 父级工厂
    providers: Provider[] = []
): (extraProviders?: Provider[]) => PlatformRef {
  const marker = new InjectionToken(`Platform: ${name}`);
  return (extraProviders: Provider[] = []) => {
    let platform = getPlatform();
    // 保证只能创建一个平台
    if (!platform || platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
      if (parentPlatformFactory) {
        // 有父级平台工厂的话使用父级并注入自己包含的注入器
        parentPlatformFactory(providers.concat(extraProviders).concat({provide: marker, useValue: true}));
      } else {
        // 没有父级平台说明是爷爷平台了 那就直接创建平台
        createPlatform(ReflectiveInjector.resolveAndCreate(providers.concat(extraProviders).concat({provide: marker, useValue: true})));
      }
    }
    // 确保平台已被创建并包含maker信息并返回创建好的平台
    return assertPlatform(marker);
  };
}
export function assertPlatform(requiredToken: any): PlatformRef {
  const platform = getPlatform();
  if (!platform) { // 确保平台被创建
    throw new Error('No platform exists!');
  }
  if (!platform.injector.get(requiredToken, null)) { // 这里是确保 marker 被注入
    throw new Error('A platform with a different configuration has been created. Please destroy it first.');
  }
  return platform;
}
```

看来核心的创建平台的代码就在 createPlatform 里了:

``` javascript
// 最顶级的平台工厂会执行并创建出平台
export function createPlatform(injector: Injector): PlatformRef {
  // 存在平台 && 未销毁 && 不允许多个平台
  if (_platform && !_platform.destroyed && !_platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
    throw new Error('There can be only one platform. Destroy the previous one to create a new one.');
  }
  // 得到这个平台引用
  _platform = injector.get(PlatformRef);
  // 得到服务商
  const inits = injector.get(PLATFORM_INITIALIZER, null);
  // 执行初始化
  if (inits) inits.forEach((init: any) => init());
  // 返回初始化完成的平台
  return _platform;
}
```

看完 createPlatform，没错angular又继续踢皮球了，回忆创建爷爷平台时注入的那一堆服务中，就有个 PlatformRef，可不就是平台引用吗~

### 使用创建的平台引用启动根模块
上面的爷爷平台注入了一个平台引用，其实现是 PlatformRef_，其提供了启动模块的一些方法，将在两部曲的第二步中用到。
首先径直在 /packages/core/src/application_ref.ts 下的 PlatformRef_ 中找到 bootstrapModule 方法:

``` javascript
// 启动根模块就是调用这个
bootstrapModule<M>(
    moduleType: Type<M>, // 模块类
    compilerOptions: CompilerOptions|CompilerOptions[] = [] // 编译选项
): Promise<NgModuleRef<M>> {
    return this._bootstrapModuleWithZone(moduleType, compilerOptions);
}
private _bootstrapModuleWithZone<M>(
    moduleType: Type<M>, compilerOptions: CompilerOptions|CompilerOptions[] = [],
    ngZone?: NgZone
): Promise<NgModuleRef<M>> {
    const compilerFactory: CompilerFactory = this.injector.get(CompilerFactory); // 从注入器中得到编译器工厂
    const compiler = compilerFactory.createCompiler( // 创建出编译器 传入的是编译选项 会创建一堆注入器 包括编译器 并会将编译器作为返回
        Array.isArray(compilerOptions) ? compilerOptions : [compilerOptions]
    );
    return compiler.compileModuleAsync(moduleType) // 编译模块
        .then((moduleFactory) => this._bootstrapModuleFactoryWithZone(moduleFactory, ngZone)); // 启动模块工厂并加入NgZone
}
```

里面涉及到了几个步骤:
1. 从注入器中取出前面在爸爸平台注入的 CompilerFactory
2. 使用 CompilerFactory 创建出编译器并传入编译选项(可以为空)
3. 使用编译器异步编译传入的根模块，并在回调中执行一个名字很长的方法 _bootstrapModuleFactoryWithZone

其中 compileModuleAsync 即编译模块的细节涉及到了许多其他的东西，限于篇幅本文暂且不去解读它。

现在最后剩下了一个 _bootstrapModuleFactoryWithZone 方法。此方法做的事情主要是使用传入的模块工厂(由异步编译模块得到)创建出最终的模块来，并为其注入一个新建的NgZone实例:

``` javascript
private _bootstrapModuleFactoryWithZone<M>(moduleFactory: NgModuleFactory<M>, ngZone?: NgZone):
      Promise<NgModuleRef<M>> {
    // 创建新的NgZone实例
    if (!ngZone) ngZone = new NgZone({enableLongStackTrace: isDevMode()});
    return ngZone.run(() => {
      const ngZoneInjector =
          ReflectiveInjector.resolveAndCreate([{provide: NgZone, useValue: ngZone}], this.injector);
      // 创建模块引用(注入上面的注入器) 注入的服务商包括 NgZone 和 传入的其他注入器
      const moduleRef = <InternalNgModuleRef<M>>moduleFactory.create(ngZoneInjector);
      const exceptionHandler: ErrorHandler = moduleRef.injector.get(ErrorHandler, null);
      if (!exceptionHandler) {
        throw new Error('No ErrorHandler. Is platform module (BrowserModule) included?');
      }
      moduleRef.onDestroy(() => remove(this._modules, moduleRef));
      ngZone !.runOutsideAngular(() => ngZone !.onError.subscribe({next: (error: any) => {
        exceptionHandler.handleError(error); 
      }}));
      return _callAndReportToErrorHandler(exceptionHandler, ngZone !, () => {
        const initStatus: ApplicationInitStatus = moduleRef.injector.get(ApplicationInitStatus);
        // 执行初始化 细节待研究
        initStatus.runInitializers();
        return initStatus.donePromise.then(() => {
          this._moduleDoBootstrap(moduleRef);
          return moduleRef;
        });
      });
    });
  }
```

收回前面最后这两个字，现在皮球又踢给了 _moduleDoBootstrap 方法:

``` javascript
private _moduleDoBootstrap(moduleRef: InternalNgModuleRef<any>): void {
    // 得到app引用
    const appRef = moduleRef.injector.get(ApplicationRef) as ApplicationRef;
    if (moduleRef._bootstrapComponents.length > 0) {
      // 启动所有启动组件 至于启动组件哪里来待研究
      moduleRef._bootstrapComponents.forEach(f => appRef.bootstrap(f));
    } else if (moduleRef.instance.ngDoBootstrap) {
      // 属于手动执行ngDoBootstrap方法的情况
      moduleRef.instance.ngDoBootstrap(appRef);
    } else {
      // 既没有启动组件又没有手动执行启动，则抛出错误
      throw new Error(
          `The module ${stringify(moduleRef.instance.constructor)} was bootstrapped, but it does not declare "@NgModule.bootstrap" components nor a "ngDoBootstrap" method. ` +
          `Please define one of these.`);
    }
    // 现在模块也启动好了 连启动组件都初始化好了 把这个模块push到平台的模块列表中吧
    this._modules.push(moduleRef);
}
```

这里是不是有点恍然大悟，模块启动好后，此方法中进一步操作了启动组件，也就是我们在AppModule中都要配置给bootstrap的入口组件:

``` javascript
bootstrap: [ AppComponent ]
```

至此模块引用也彻底创建好了，也就是说angular项目终于是启动成功了，当然其中模块以及组件编译过程还深不可测，值得细细研究。

## 总结
* 回顾angular项目的启动，分为平台的创建和模块的创建两步
* 可以认为平台就是一个服务，平台的创建做的事情就是创建一个对象，一个注入了一大堆服务的对象
* 一个angular应用只能有一个平台，或者说此平台被视为angular应用本身，由此平台来编译模块，管理服务等
* 模块的创建由于涉及到很多编译方面的内容本文还来不及去深入，不过已知的信息是:
    * 模块由平台使用其注入的编译器工厂生产出一个编译器进行编译得到
    * 完成模块的编译后要进一步启动模块，启动的方式是得到其应用引用(ApplicationRef)来启动其启动组件(AppComponent)