(() => {
  "use strict";
  var __webpack_modules__ = {
    "./src/user的末日游戏/脚本/MVU/index.ts"(module, __webpack_exports__, __webpack_require__) {
      eval('{__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var https_testingcf_jsdelivr_net_gh_MagicalAstrogy_MagVarUpdate_artifact_bundle_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js */ "https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([https_testingcf_jsdelivr_net_gh_MagicalAstrogy_MagVarUpdate_artifact_bundle_js__WEBPACK_IMPORTED_MODULE_0__]);\nvar __webpack_async_dependencies_result__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\nhttps_testingcf_jsdelivr_net_gh_MagicalAstrogy_MagVarUpdate_artifact_bundle_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_async_dependencies_result__[0];\n\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvdXNlcueahOacq+aXpea4uOaIjy/ohJrmnKwvTVZVL2luZGV4LnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUEwRiIsInNvdXJjZXMiOlsic3JjOi8vdGF2ZXJuX2hlbHBlcl90ZW1wbGF0ZS9zcmMvdXNlcueahOacq+aXpea4uOaIjy/ohJrmnKwvTVZVL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnaHR0cHM6Ly90ZXN0aW5nY2YuanNkZWxpdnIubmV0L2doL01hZ2ljYWxBc3Ryb2d5L01hZ1ZhclVwZGF0ZS9hcnRpZmFjdC9idW5kbGUuanMnO1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/user的末日游戏/脚本/MVU/index.ts\n\n}');
    },
    "https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js"(module) {
      module.exports = import("https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js");
    }
  };
  var __webpack_module_cache__ = {};
  function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (cachedModule !== undefined) {
      return cachedModule.exports;
    }
    var module = __webpack_module_cache__[moduleId] = {
      exports: {}
    };
    if (!(moduleId in __webpack_modules__)) {
      delete __webpack_module_cache__[moduleId];
      var e = new Error("Cannot find module '" + moduleId + "'");
      e.code = "MODULE_NOT_FOUND";
      throw e;
    }
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
  }
  (() => {
    var hasSymbol = typeof Symbol === "function";
    var webpackQueues = hasSymbol ? Symbol("webpack queues") : "__webpack_queues__";
    var webpackExports = hasSymbol ? Symbol("webpack exports") : "__webpack_exports__";
    var webpackError = hasSymbol ? Symbol("webpack error") : "__webpack_error__";
    var resolveQueue = queue => {
      if (queue && queue.d < 1) {
        queue.d = 1;
        queue.forEach(fn => fn.r--);
        queue.forEach(fn => fn.r-- ? fn.r++ : fn());
      }
    };
    var wrapDeps = deps => deps.map(dep => {
      if (dep !== null && typeof dep === "object") {
        if (dep[webpackQueues]) return dep;
        if (dep.then) {
          var queue = [];
          queue.d = 0;
          dep.then(r => {
            obj[webpackExports] = r;
            resolveQueue(queue);
          }, e => {
            obj[webpackError] = e;
            resolveQueue(queue);
          });
          var obj = {};
          obj[webpackQueues] = fn => fn(queue);
          return obj;
        }
      }
      var ret = {};
      ret[webpackQueues] = x => {};
      ret[webpackExports] = dep;
      return ret;
    });
    __webpack_require__.a = (module, body, hasAwait) => {
      var queue;
      hasAwait && ((queue = []).d = -1);
      var depQueues = new Set;
      var exports = module.exports;
      var currentDeps;
      var outerResolve;
      var reject;
      var promise = new Promise((resolve, rej) => {
        reject = rej;
        outerResolve = resolve;
      });
      promise[webpackExports] = exports;
      promise[webpackQueues] = fn => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
      module.exports = promise;
      var handle = deps => {
        currentDeps = wrapDeps(deps);
        var fn;
        var getResult = () => currentDeps.map(d => {
          if (d[webpackError]) throw d[webpackError];
          return d[webpackExports];
        });
        var promise = new Promise(resolve => {
          fn = () => resolve(getResult);
          fn.r = 0;
          var fnQueue = q => q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, 
          q.push(fn)));
          currentDeps.map(dep => dep[webpackQueues](fnQueue));
        });
        return fn.r ? promise : getResult();
      };
      var done = err => (err ? reject(promise[webpackError] = err) : outerResolve(exports), 
      resolveQueue(queue));
      body(handle, done);
      queue && queue.d < 0 && (queue.d = 0);
    };
  })();
  (() => {
    __webpack_require__.r = exports => {
      if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, {
          value: "Module"
        });
      }
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
    };
  })();
  var __webpack_exports__ = __webpack_require__("./src/user的末日游戏/脚本/MVU/index.ts");
})();