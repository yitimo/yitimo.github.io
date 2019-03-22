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
/******/ 			if(installedChunks[chunkId]) {
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
/******/ 	deferredModules.push([2,1]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */,
/* 2 */
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
var ReactDOM = __webpack_require__(4);
__webpack_require__(9);
__webpack_require__(10);
var App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    App.prototype.render = function () {
        return (React.createElement("div", { className: "nav" },
            React.createElement("a", { className: "nav-avatar", href: "/" },
                React.createElement("img", { src: "/assets/images/yitimo.jpg", alt: "nav-avatar of yitimo" }),
                React.createElement("div", null, "Yitimo's Blog")),
            React.createElement("div", { className: "nav-body" },
                React.createElement("a", { className: "nav-body-block", href: "https://github.com/yitimo", target: "_blank" },
                    React.createElement("img", { src: "/assets/images/github.png", alt: "Github", title: "Github" })),
                React.createElement("div", { id: "blog-nav" })),
            React.createElement("div", { className: "nav-foot" },
                React.createElement("a", { href: "javascript:void(0);" },
                    "\u5173\u4E8E\u6211",
                    React.createElement("img", { src: "/assets/images/arrow_right.png", className: "icon" })),
                React.createElement("div", { id: "nav-concact" },
                    "\u8054\u7CFB\u6211",
                    React.createElement("img", { src: "/assets/images/arrow_right.png", className: "icon" }),
                    React.createElement("div", { id: "nav-publish-popup", style: { display: "none" } },
                        React.createElement("a", { href: "mailto:admin@yitimo.com" }, "\u4E2A\u4EBA\u90AE\u7BB1"),
                        React.createElement("a", { href: "mailto:yitimohu@gmail.com" }, "Gmail"))),
                React.createElement("div", { id: "nav-publish" },
                    "\u6B64\u535A\u5BA2\u540C\u65F6\u90E8\u7F72\u5728",
                    React.createElement("img", { src: "/assets/images/arrow_right.png", className: "icon" }),
                    React.createElement("div", { id: "nav-concact-popup", style: { display: "none" } },
                        React.createElement("a", { href: "https://yitiblog.netlify.com/", target: "_blank" }, "Netlify"),
                        React.createElement("a", { href: "https://yitimo.github.io/", target: "_blank" }, "Github Page"))))));
    };
    return App;
}(React.Component));
exports.App = App;
ReactDOM.render(React.createElement(App, null), document.getElementById("blog-nav"));


/***/ }),
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(11);

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"sourceMap":false,"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(13)(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(12)(false);
// Module
exports.push([module.i, ".nav-foot > * {\n  padding: 15px;\n  color: #E4E7EC;\n  transition: 0.2s;\n  cursor: pointer;\n  display: block;\n  font-size: 15px; }\n\n.nav-foot > *:hover {\n  color: #FFFFFF;\n  background: #de6d6d; }\n\n.nav-foot > * > .icon {\n  width: 24px;\n  height: 24px;\n  float: right;\n  display: block; }\n\n#nav-publish-popup, #nav-concact-popup {\n  position: absolute;\n  width: 120px;\n  height: auto;\n  background: #de6d6d;\n  z-index: 1; }\n\n#nav-publish-popup a, #nav-concact-popup a {\n  padding: 15px;\n  color: #E4E7EC;\n  transition: 0.2s;\n  cursor: pointer;\n  display: block;\n  font-size: 15px; }\n\n@media screen and (min-width: 1200px) {\n  .nav {\n    width: 400px;\n    background: #cd5c5c;\n    display: -webkit-box;\n    display: -webkit-flex;\n    display: flex;\n    flex-flow: column;\n    height: 100%;\n    overflow: hidden; }\n  .nav-body {\n    padding-right: 16px;\n    flex: 1; }\n  .nav-body-block {\n    padding: 12px;\n    display: inline-block;\n    border-radius: 4px;\n    transition: 0.2s;\n    text-align: center;\n    margin: 16px 0 0 16px; }\n  .nav-body-block img {\n    height: 70px;\n    width: 70px; }\n  .nav-body-block:hover {\n    background: #de6d6d; }\n  .nav-foot-block {\n    text-align: center; }\n  .nav-foot-block-title {\n    opacity: 0.7;\n    text-align: left;\n    padding: 24px 16px 16px 16px; }\n  .nav-foot-block a {\n    width: 200px;\n    height: 64px;\n    line-height: 64px;\n    text-align: center;\n    color: #fafafa;\n    transition: 0.2s;\n    display: inline-block; }\n  .nav-foot-block a:hover {\n    color: #ffffff;\n    background: #de6d6d; }\n  .nav-avatar {\n    transition: 0.2s;\n    height: auto;\n    padding: 16px;\n    text-align: center;\n    background: #cd5c5c;\n    width: 100%; }\n  .nav-avatar img {\n    height: 50px;\n    width: 50px;\n    border-radius: 100px; } }\n\n@media screen and (max-width: 1200px) and (min-width: 1000px) {\n  .nav {\n    width: 300px;\n    background: #cd5c5c;\n    display: -webkit-box;\n    display: -webkit-flex;\n    display: flex;\n    flex-flow: column;\n    height: 100%;\n    overflow: hidden; }\n  .nav-body {\n    padding-right: 16px;\n    flex: 1; }\n  .nav-body-block {\n    display: inline-block;\n    border-radius: 4px;\n    transition: 0.2s;\n    text-align: center;\n    padding: 8px;\n    margin: 8px 0 0 8px; }\n  .nav-body-block img {\n    width: 50px;\n    height: 50px; }\n  .nav-body-block:hover {\n    background: #de6d6d; }\n  .nav-avatar {\n    transition: 0.2s;\n    height: 120px;\n    padding: 16px;\n    text-align: center;\n    background: #cd5c5c;\n    width: 100%; }\n  .nav-avatar:hover {\n    background: #de6d6d; }\n  .nav-avatar img {\n    height: 50px;\n    width: 50px;\n    border-radius: 100px; } }\n\n@media screen and (max-width: 1000px) and (min-width: 768px) {\n  .nav {\n    width: 200px;\n    background: #cd5c5c;\n    display: -webkit-box;\n    display: -webkit-flex;\n    display: flex;\n    flex-flow: column;\n    height: 100%;\n    overflow: hidden; }\n  .nav-body {\n    padding-right: 16px;\n    flex: 1; }\n  .nav-body-block {\n    padding: 8px;\n    display: inline-block;\n    border-radius: 4px;\n    transition: 0.2s;\n    text-align: center;\n    margin: 16px 0 0 16px; }\n  .nav-body-block img {\n    height: 40px;\n    width: 40px; }\n  .nav-body-block:hover {\n    background: #de6d6d; }\n  .nav-avatar {\n    transition: 0.2s;\n    height: 120px;\n    padding: 16px;\n    text-align: center;\n    background: #cd5c5c;\n    width: 100%; }\n  .nav-avatar:hover {\n    background: #de6d6d; }\n  .nav-avatar img {\n    height: 50px;\n    width: 50px;\n    border-radius: 100px; } }\n\n@media screen and (max-width: 767px) {\n  .nav {\n    background: #cd5c5c;\n    padding-top: 50px; }\n  .nav-avatar {\n    transition: 0.2s;\n    text-align: center;\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 50px;\n    z-index: 10;\n    line-height: 50px;\n    background: #cd5c5c; }\n  .nav-avatar:active {\n    background: #de6d6d; }\n  .nav-avatar img {\n    width: 32px;\n    height: 32px;\n    border-radius: 100px;\n    background: none;\n    margin-bottom: -8px; }\n  .nav-avatar div {\n    display: inline; }\n  .nav-body-block {\n    width: 25%;\n    padding: 8px;\n    display: inline-block;\n    transition: 0.2s;\n    text-align: center; }\n  .nav-body-block img {\n    width: 32px;\n    height: 32px; }\n  .nav-body-block:active {\n    background: #de6d6d; }\n  .nav-foot {\n    display: none; } }\n", ""]);



/***/ })
/******/ ]);
//# sourceMappingURL=app.45d5272e5396bcff42f2.bundle.js.map