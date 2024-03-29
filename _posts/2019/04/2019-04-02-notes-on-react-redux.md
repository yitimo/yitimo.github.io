---
layout: post
title:  react+redux笔记
date:   2019-04-02 16:12:13 +0800
author: yitimo
categories: frontend
tags: ["frontend", "react"]
keywords:
- react,
- redux,
description: react+redux笔记，react系列上手过程中对其渐进式的理解.
---

* react本身做的事情大体是根据编写好的组件渲染出真实的DOM。
* * 编写的组件可以是一个``es6/typescript``的``class``，也可以直接是个返回标签的函数。
* * 组件通过props接收父级传入的值，通过state维护自己内部的值。
* * 父级传入的props更改时会触发：``componentWillReceiveProps`` -> ``shouldComponentUpdate`` -> ``componentWillUpdate`` -> ``render`` -> ``componentDidUpdate``，最终更新界面值。
* * 内部``state``更改时会触发：``shouldComponentUpdate`` -> ``componentWillUpdate`` -> ``render`` -> ``componentDidUpdate``，最终更新界面值。
* * 组件本身通过``setState``更新``state``，以更新界面值。
* * react本身封装好了标签的一些事件(``onClick``等)，也可以通过``ref``获取真实DOM的引用(``componentDidMount``中可访问到)。

---

* redux本身做的事情大体是帮助维护一份单例的数据集(store)。
* * 通过``subscribe``监听状态变化，``getState``获取当前状态。
* * 通过``reducer``来决定不同``action``都会如何操作数据。
* * 通过``action``来规范支持的操作。
* * 通过``dispatch``方法来传入``action``。

---

至此可以这么使用react+redux：

``` javascript
const store = createStore(...)

class App extends Component{

  componentWillMount(){
    store.subscribe((state)=>this.setState(state))
  }
  
  render(){
    return <Comp state={this.state}
        onIncrease={()=>store.dispatch({type: 'ACTION1'})}
        onDecrease={()=>store.dispatch({type: 'ACTION2'})}
    />
  }
}
```

---

* react-redux帮助react整合redux到自己的组件体系中。
* * 直接解决的问题就是不用层层传入``props``来访问``store``了。
* * 顶层包裹``Provider``组件并传入``store``来使用。
* * ``Provider``组件做的事是用``Context``维护一份store。
* * 需要访问store的组件用``connect``来将状态和``action``注入到``props``中。

---

* mapStateToProps是``connect``的第一个参数，帮助绑定状态到组件的``props``。
* * 此函数返回的对象会被整合到组件``props``中。
* * 函数第一个参数(``state``)为全局所有的``reducer``，即``store``中的数据
* * 函数第二个参数(``ownProps``)为组件本身的``props``。
* * 每当状态更新时最先触发``mapStateToProps``，随后走组件``update``四步。
* * 组件本身传入的props更改不会触发``mapStateToProps``，但传入``ownProps``后就也会触发。

---

* mapDispatchToProps是``connect``的第二个参数，帮助绑定``action``到组件的``props``。
* * 也就是说现在可以在组件中调用``action``了。
* * 执行action需要dispatch，但是可以用``bindActionCreators``来隐藏dispatch部分。

---

至此可以这么使用``react``+``redux``+``react-redux``：

``` javascript
const mapStateToProps = (state) => ({
  count: state.count,
})
const mapDispatchToProps = (dispatch, ownProps) => {
  return bindActionCreators({
    increase: action.increase,
    decrease: action.decrease,
  });
}

class MyComp extends Component {
  render(){
    const {count, increase, decrease} = this.props;
    return (<div>
      <div>计数：{this.props.count}次</div>
      <button onClick={increase}>增加</button>
      <button onClick={decrease}>减少</button>
    </div>)
  }
}

const Comp = connect(mapStateToProps, mapDispatchToProps)(MyComp);

```

---

connect后续两个参数之后再深究，其中第三个可以自定义状态如何merge到组件的``props``中。

---

参考链接：

* 上文示例代码搬迁自[这里](http://taobaofed.org/blog/2016/08/18/react-redux-connect/)。
* [mapStateToProps, and why you may not need mapDispatchToProps when you start Redux](https://medium.com/ovrsea/mapstatetoprops-and-why-you-may-not-need-mapdispatchtoprops-as-a-beginner-dd012a3da5e6)

---

* redux-thunk 异步的redux
* * 可接收函数作为action，也就是先dispatch这个action发起异步操作。
* * 在此函数中通过第一个参数(dispatch)调用其他``action``，以完成异步action效果。

---

* redux-saga 异步的redux
* * 在单独的saga模块中监听组件发起的action。
* * 接收到组件action后执行异步方法，执行完成后再发起action到reducer。
* * reducer接收到saga发起的action后返回新state到组件。
* * saga对action的监听不影响reducer直接处理这个action，可以同时触发。
* * 个人感觉像redux专用的小``rx``。

1. 组件dispatch一个``ActionA``
2. saga监听到``ActionA``
3. 执行异步逻辑
4. put一个``ActionB``到reducer
5. reducer返回新状态到组件
