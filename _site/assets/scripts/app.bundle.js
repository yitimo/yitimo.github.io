/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		0: 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/assets/scripts/";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push([4,1]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(0);
var ReactDOM = __webpack_require__(6);
var Avatar_1 = __webpack_require__(10);
var Cube_1 = __webpack_require__(14);
var Menu_1 = __webpack_require__(15);
__webpack_require__(18);
__webpack_require__(19);
var App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.menus = [{
                name: "关于我",
                children: [{
                        name: "个人简历",
                        link: "/hidden/2019/03/25/yitimo-curriculum-vitae.html"
                    }]
            }, {
                name: "联系我",
                children: [{
                        name: "个人邮箱",
                        link: "mailto:admin@yitimo.com"
                    }, {
                        name: "Gmail",
                        link: "mailto:yitimohu@gmail.com"
                    }]
            }, {
                name: "此博客同时部署在",
                children: [{
                        name: "Netlify",
                        link: "https://yitiblog.netlify.com/"
                    }, {
                        name: "Github Page",
                        link: "https://yitimo.github.io/"
                    }]
            }];
        return _this;
    }
    App.prototype.render = function () {
        return (React.createElement("div", { className: "nav" },
            React.createElement(Avatar_1.Avatar, { src: "/assets/images/yitimo.jpg" }),
            React.createElement("div", { className: "nav-body" },
                React.createElement(Cube_1.Cube, { link: "https://github.com/yitimo", icon: "/assets/images/github.png", name: "Github" })),
            React.createElement("div", { className: "nav-foot" }, this.menus.map(function (menu) { return React.createElement(Menu_1.Menu, { name: menu.name, link: menu.link, children: menu.children }); }))));
    };
    return App;
}(React.Component));
exports.App = App;
ReactDOM.render(React.createElement(App, null), document.getElementById("blog-nav"));


/***/ }),
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(0);
__webpack_require__(11);
var Avatar = /** @class */ (function (_super) {
    __extends(Avatar, _super);
    function Avatar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Avatar.prototype.render = function () {
        return (React.createElement("a", { className: "nav-avatar", href: "/" },
            React.createElement("img", { src: this.props.src, alt: "nav-avatar of yitimo" }),
            React.createElement("div", null, "Yitimo's Blog")));
    };
    return Avatar;
}(React.Component));
exports.Avatar = Avatar;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(12);

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"sourceMap":false,"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(2)(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(false);
// Module
exports.push([module.i, ".nav-avatar{transition:0.2s;height:auto;padding:16px;text-align:center;background:#cd5c5c;width:100%}.nav-avatar img{height:50px;width:50px;border-radius:100px}@media screen and (max-width: 1199px) and (min-width: 1000px){.nav-avatar:hover{background:#de6d6d}}@media screen and (max-width: 767px){.nav-avatar{position:fixed;top:0;left:0;width:100%;height:50px;z-index:10;padding:0;line-height:50px;background:#cd5c5c}.nav-avatar img{width:32px;height:32px;background:none;margin-bottom:-8px}.nav-avatar div{display:inline;margin-left:5px}}\n", ""]);



/***/ }),
/* 13 */,
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(0);
var Cube = /** @class */ (function (_super) {
    __extends(Cube, _super);
    function Cube() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Cube.prototype.render = function () {
        return (React.createElement("a", { className: "nav-body-block", href: this.props.link, target: "_blank" },
            React.createElement("img", { src: this.props.icon, alt: this.props.name, title: this.props.name })));
    };
    return Cube;
}(React.Component));
exports.Cube = Cube;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__(0);
__webpack_require__(16);
var Menu = /** @class */ (function (_super) {
    __extends(Menu, _super);
    function Menu(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            opened: false
        };
        return _this;
    }
    Menu.prototype.enter = function (isSwitch, link) {
        console.log(isSwitch, link);
        if (isSwitch) {
            this.setState({ opened: !this.state.opened });
        }
        else if (!link || !link.length) {
            return;
        }
        else {
            window.location.href = link;
        }
    };
    Menu.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { className: "nav-menu" },
            React.createElement("a", { className: this.state.opened ? "active" : "", onClick: function () { return _this.enter(_this.props.children && !!_this.props.children.length, _this.props.link); } },
                this.props.name,
                React.createElement("img", { src: "/assets/images/arrow_right.png", className: "icon" })),
            this.props.children && this.props.children.length &&
                React.createElement("div", { style: { display: this.props.children.length && this.state.opened ? "block" : "none" } }, this.props.children.map(function (menu) { return React.createElement("a", { href: menu.link, onClick: function () { return _this.enter(false, menu.link); } }, menu.name); }))));
    };
    return Menu;
}(React.Component));
exports.Menu = Menu;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(17);

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"sourceMap":false,"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(2)(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(false);
// Module
exports.push([module.i, ".nav-menu a{display:block;width:100%;padding:15px;color:#E4E7EC;transition:0.2s;cursor:pointer;display:block;font-size:15px}.nav-menu>a:hover,.nav-menu>a.active{color:#FFFFFF;background:#de6d6d}.nav-menu>div{background:#de7a6d}.nav-menu>div>a:hover{color:#FFFFFF;background:#de876d}.nav-menu .icon{width:24px;height:24px;float:right;display:block}@media screen and (max-width: 767px){.nav-menu{display:none}}\n", ""]);



/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(20);

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"sourceMap":false,"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(2)(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(false);
// Module
exports.push([module.i, ".nav{width:400px;background:#cd5c5c;display:-webkit-box;display:-webkit-flex;display:flex;flex-flow:column;height:100%;overflow:hidden;user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-user-select:none}#nav-publish-popup,#nav-concact-popup{position:absolute;width:120px;height:auto;background:#de6d6d;z-index:1}#nav-publish-popup a,#nav-concact-popup a{padding:15px;color:#E4E7EC;transition:0.2s;cursor:pointer;display:block;font-size:15px}@media screen and (min-width: 1200px){.nav-body{padding-right:16px;flex:1}.nav-body-block{padding:12px;display:inline-block;border-radius:4px;transition:0.2s;text-align:center;margin:16px 0 0 16px}.nav-body-block img{height:70px;width:70px}.nav-body-block:hover{background:#de6d6d}}@media screen and (max-width: 1200px) and (min-width: 1000px){.nav{width:300px}.nav-body{padding-right:16px;flex:1}.nav-body-block{display:inline-block;border-radius:4px;transition:0.2s;text-align:center;padding:8px;margin:8px 0 0 8px}.nav-body-block img{width:50px;height:50px}.nav-body-block:hover{background:#de6d6d}}@media screen and (max-width: 1000px) and (min-width: 768px){.nav{width:200px}.nav-body{padding-right:16px;flex:1}.nav-body-block{padding:8px;display:inline-block;border-radius:4px;transition:0.2s;text-align:center;margin:16px 0 0 16px}.nav-body-block img{height:40px;width:40px}.nav-body-block:hover{background:#de6d6d}}@media screen and (max-width: 767px){.nav{background:#cd5c5c;padding-top:50px;display:block;width:100%;height:auto}.nav-body-block{width:25%;padding:8px;display:inline-block;transition:0.2s;text-align:center}.nav-body-block img{width:32px;height:32px}.nav-body-block:active{background:#de6d6d}.nav-foot{display:none}}\n", ""]);



/***/ })
/******/ ]);
//# sourceMappingURL=app.bundle.js.map