---
layout: post
title:  从源码理解angular编译AppModule的过程
date:   2017-09-28 17:35:00 +0800
author: yitimo
categories: Angular
tags: ["angular"]
keywords:
- angular,
- angular source code
description: 从源码分析angular启动过程中模块的编译细节。
---
承接[上文](/jekyll/update/2017/09/25/how-angular-bootstrap-in-jit.html)。笔者之前将一个angular项目的启动过程分为了两步: 创建平台得到 ``PlatformRef`` ，以及执行平台引用提供的方法编译根模块 ``AppModule`` 。本文就将着眼于创建好的平台，从angular的茫茫源代码中看看整个AppModule的编译过程。

## 编译的起点

从外界使用的 ``bootstrapModule`` 方法入手。首先angular把皮球踢给了私有方法 ``_bootstrapModuleWithZone`` ，然后皮球又踢给了 ``compileModuleAsync`` 方法，这个方法比较调皮，直接进入是一个抽象方法，说明它有一个继承并且在前面作为服务被注入了，它就是！在创建爸爸平台 ``platformCoreDynamic`` 时注入的编译器工厂中提供的 ``createCompiler`` 方法返回的编译器实例，也就是 ``JitCompiler`` 。进入 ``JitCompiler`` 果不其然找到了 ``compileModuleAsync`` 方法的实现。

```
// 启动过程中就是用这个异步编译模块
compileModuleAsync<T>(moduleType: Type<T>): Promise<NgModuleFactory<T>> {
    return Promise.resolve(this._compileModuleAndComponents(moduleType, false));
}
```

坏消息是皮球现在踢给了私有方法 ``_compileModuleAndComponents`` :

```
// 这个就是最底层编译模块的方法
private _compileModuleAndComponents<T>(
    moduleType: Type<T>,
    isSync: boolean
): SyncAsync<NgModuleFactory<T>> {
    // 相当于 把第一个参数的结果作为第二个表达式的参数
    // 但在这里只是保证两个参数顺序执行
    // 最后做了三件事 _loadModules _compileComponents _compileModule
    return SyncAsync.then(this._loadModules(moduleType, isSync), () => {
        // 加载好模块后编译组件
        this._compileComponents(moduleType, null);
        // 编译模块并返回
        return this._compileModule(moduleType);
    });
}
```

稍微感受一下这个 SyncAsync 对象，很厉害：

```
export const SyncAsync = {
  // 断言同步 也就是说 如果是个Promise 那就抛出 不是的话直接返回
  assertSync: <T>(value: SyncAsync<T>): T => {
    if (isPromise(value)) {
      throw new Error(`Illegal state: value cannot be a promise`);
    }
    return value;
  },
  // 除了适配普通Promise外还能处理非Promise的情况 将value作为参数传入cb
  then: <T, R>(
    value: SyncAsync<T>,
    cb: (value: T) => R | Promise<R>| SyncAsync<R>
  ): SyncAsync<R> => {
    // 如果是Promise则继续这个promise(用cb接上)，否则的话直接执行cb 还是相当于接上 强行接上不是Promise的情况
    return isPromise(value) ? value.then(cb) : cb(value);
  },
  all: <T>(syncAsyncValues: SyncAsync<T>[]): SyncAsync<T[]> => {
    // 只要里面有Promise 那就执行 Promise.all(并行执行这些Promise) 一个都没有嘛那就直接返回
    return syncAsyncValues.some(isPromise) ? Promise.all(syncAsyncValues) : syncAsyncValues as T[];
  }
};
```

现在看来，模块编译的重头戏就在这三个方法里面了:

```
_loadModules 负责加载模块元数据
_compileComponents 负责编译组件
_compileModule 负责编译模块
```

## _loadModules 加载模块

加载过程是这样的:

```
private _loadModules(mainModule: any, isSync: boolean): SyncAsync<any> {
    const loading: Promise<any>[] = []; // 最终会把所有任务放到这里 用SyncAsync 串起来执行
    // 拿到模块元数据 里面包含了所有模块 以及模块涉及的服务 指令 管道
    const mainNgModule = this._metadataResolver.getNgModuleMetadata(mainModule) !;
    // 遍历元数据中的模块
    this._filterJitIdentifiers(mainNgModule.transitiveModule.modules).forEach((nestedNgModule) => {
        // getNgModuleMetadata only returns null if the value passed in is not an NgModule
        // 递归获取模块元数据的万恶之源 getNgModuleMetadata
        const moduleMeta = this._metadataResolver.getNgModuleMetadata(nestedNgModule) !;
        // 遍历这些模块的元数据拿到其声明组件的元数据
        this._filterJitIdentifiers(moduleMeta.declaredDirectives).forEach((ref) => {
            const promise =
                this._metadataResolver.loadDirectiveMetadata(moduleMeta.type.reference, ref, isSync); // 这货会把指令元数据(包括组件)放到缓存 返回的是null
            if (promise) {
                loading.push(promise);
            }
        });
        // 遍历这些模块元数据拿到其声明管道的元数据
        this._filterJitIdentifiers(moduleMeta.declaredPipes)
            .forEach((ref) => this._metadataResolver.getOrLoadPipeMetadata(ref));
    });
    return SyncAsync.all(loading);
}
```

表面上代码量还不算大，不过里面还踢了几次皮球，而且存在递归，工作量非常恐怖，所做的事情如下：

1. 执行 getNgModuleMetadata 拿到模块元数据
    * 执行 _ngModuleResolver.resolve 拿到模块本身的注解信息(即 ``@NgModule({})`` 中的配置信息)
    * 遍历注解中的 imports 部分 将模块所有引入的元数据添加到 importedModules，并收集了里面的服务 providers (这一步会递归调用 getNgModuleMetadata 来获得模块元数据，保证除了懒加载模块外所有与根模块关联的元数据都遍历到)
    * 遍历注解中的 exports 部分 将所有Ng类(模块、组件、指令) 元数据收集到 exportedModules
    * 新建一个 transitiveModule 用来放所有导入、导出的Ng类的元数据 据注释说是写法要改所以单独拷贝一份
    * 遍历注解中的 declaration 部分，将指令元数据放到 declaredDirectives，管道元数据放到 declaredPipes，同时都添加到 transitiveModule 中
    * 遍历所有无模块包裹的指令和管道，如果已经存在于 transitiveModule 中说明是由模块自己声明的，(引入的必定有模块包裹)，若不存在于 transitiveModule 中则抛出模块既未导入又未声明的错误
    * 接下来处理 providers 部分(在 imports和exports 后面处理，保证自己本身注入的服务的优先级)
    * 处理剩下的配置相关的几个东西: entryComponents bootstrap schemas
    * 缓存收集好的元数据并返回
2. 执行 loadDirectiveMetadata 加载模块元数据中所有组件的元数据
    * 进一步遍历上面得到的 transitiveModule ，加载所有指令的元数据
3. 执行 getOrLoadPipeMetadata 加载模块元数据中所有管道的元数据
    * 进一步遍历上面得到的 transitiveModule ，加载所有管道的元数据

至此所有与AppModule关联的模块的所有元数据都已经加载进了缓存中，包括了从 AppModule 展开的整个模块树，树上的所有指令和管道的配置，以及所有的服务。

## _compileComponents 编译组件

1. 遍历模块元数据，需要拿到所有的模板，包括： 组件的模板、入口组件的模板、组件的入口组件的模板(原来组件也有入口组件)，最终拿到了所有涉及的模板，放在 templates 中
2. 执行 _compileTemplate 编译模板
    * 处理内联样式和外联样式，最终组合到 componentStylesheet
    * 处理管道和模板 得到模板片段、访问器、用到的管道(编译时会传入所有引入的管道，然后现在会留下使用到的管道)
    * 现在拿到了三样东西: 编译好的模板、用到的管道、编译好的样式表
    * 最后一步笔者没有看明白，只知道目的是生成一个组件工厂方法，并从中取出 viewClass 和 rendererType 用来给组建元数据赋值

没有看明白的最后几行代码:

```
let evalResult: any;
if (!this._compilerConfig.useJit) {
    evalResult = interpretStatements(outputContext.statements);
} else {
    evalResult = jitStatements( // 拼接得到具体工厂方法
        templateJitUrl(template.ngModule.type, template.compMeta), outputContext.statements);
}
const viewClass = evalResult[compileResult.viewClassVar];
const rendererType = evalResult[compileResult.rendererTypeVar];
// 到这一步 模板、用到的管道、样式表都已经处理好了 还创建了应该是组件的工厂方法
// 但是最后这个compile 好像把这里得到的 rendererType 一一赋值到了组件元数据中 细节待研究
template.compiled(viewClass, rendererType);
```

不明觉厉的 jitStatements 方法:

```
function evalExpression(
  sourceUrl: string,
  ctx: EmitterVisitorContext,
  vars: {[key: string]: any}
): any {
  let fnBody = `${ctx.toSource()}\n//# sourceURL=${sourceUrl}`;
  const fnArgNames: string[] = [];
  const fnArgValues: any[] = [];
  for (const argName in vars) { // 遍历添加变量
    fnArgNames.push(argName);
    fnArgValues.push(vars[argName]);
  }
  if (isDevMode()) {
    // using `new Function(...)` generates a header, 1 line of no arguments, 2 lines otherwise
    // E.g. ```
    // function anonymous(a,b,c
    // /**/) { ... }```
    // We don't want to hard code this fact, so we auto detect it via an empty function first.
    const emptyFn = new Function(...fnArgNames.concat('return null;')).toString();
    const headerLines = emptyFn.slice(0, emptyFn.indexOf('return null;')).split('\n').length - 1;
    fnBody += `\n${ctx.toSourceMapGenerator(sourceUrl, sourceUrl, headerLines).toJsComment()}`;
  }
  return new Function(...fnArgNames.concat(fnBody))(...fnArgValues);
}
// 路径 语句 好像是组合了一个新的function
// 看来是用来造工厂方法的
export function jitStatements(sourceUrl: string, statements: o.Statement[]): {[key: string]: any} {
  const converter = new JitEmitterVisitor(); // 新的发射访问器
  const ctx = EmitterVisitorContext.createRoot(); // 新的发射访问器上下文
  converter.visitAllStatements(statements, ctx); // 访问所有语句
  converter.createReturnStmt(ctx); // 创建返回语句
  return evalExpression(sourceUrl, ctx, converter.getArgs()); // 路径 上下文 参数 得到一个动态创建的方法
}
```

Anyway, all in all, whatever, 现在已经编译好了组件，放在了缓存里面。

## _compileModule 编译模块

前面执行 _loadModules 仅是加载了整个模块树的元数据，现在要正式编译它们了:

```
private _compileModule<T>(moduleType: Type<T>): NgModuleFactory<T> {
    // 从缓存拿到模块工厂
    let ngModuleFactory = this._compiledNgModuleCache.get(moduleType) !;
    if (!ngModuleFactory) { // 缓存中没有
    const moduleMeta = this._metadataResolver.getNgModuleMetadata(moduleType) !; // 重新拿到模块元数据
    // Always provide a bound Compiler
    const extraProviders = [this._metadataResolver.getProviderMetadata(new ProviderMeta(
        Compiler, {useFactory: () => new ModuleBoundCompiler(this, moduleMeta.type.reference)}))];
    const outputCtx = createOutputContext(); // 创建输出上下文
    const compileResult = this._ngModuleCompiler.compile(outputCtx, moduleMeta, extraProviders); // 执行编译
    if (!this._compilerConfig.useJit) {
        ngModuleFactory =
            interpretStatements(outputCtx.statements)[compileResult.ngModuleFactoryVar];
    } else {
        // -----------------
        ngModuleFactory = jitStatements( // 传入路径和语句 得到一个object key为字符串 value为 生成的工厂方法
            ngModuleJitUrl(moduleMeta), outputCtx.statements, )[compileResult.ngModuleFactoryVar]; // 从这个object中拿到 key为模块变量的值 看来是造了一个工厂方法
    }
    this._compiledNgModuleCache.set(moduleMeta.type.reference, ngModuleFactory); // 设置工厂方法的缓存
    }
    return ngModuleFactory;
}
```

看上去还算比较明了，做的事情如下:

1. 尝试从缓存直接拿到模块工厂
2. 无缓存则新建一个服务商和输出上下文准备编译模块
3. 执行 _ngModuleCompiler.compile 进行编译，过程很复杂待研究，但结果很简单，仅返回包含一个字符串值得类 NgModuleCompileResult ，看来是又把编译结果放缓存了
4. 使用上一步的编译结果，动态创建出一个模块的工厂方法，使用的还是那个 jitStatements 方法
5. 返回这个模块工厂方法 也就是编译的结果了

## 得到 模块工厂方法之后

得到模块的工厂方法之后，就跟之前平台的创建过程连接上了，使用这个工厂创建出模块引用，并注入一个NgZone以完成整个模块的启动。

比较扫兴的地方有这些：

1. 组件和模块的工厂方法的创建细节笔者还没有摸着头脑
2. 对于angular如何处理组件模板和模块编译的底层细节也还不明朗
3. 截至目前还没看到真正在操作DOM的影子，顶多才开始处理组件的模板

已知的情报有这些：

1. angular框架内部大量使用了依赖注入，大部分工作都被封装成了一个类(服务的本质就是一个类)，并到处注入，甚至在编译模块时模块本身的元数据也会作为服务注入使用
2. angular框架内部在处理元数据时大量使用了缓存，用来应对层层依赖的模块树(必然会出现很多重复的模块、指令、服务、管道的声明)
3. angular框架底层对许多原生操作(包括ES6新特性)都实现了一层抽象，包括 Reflect 和 DOM节点的访问器
