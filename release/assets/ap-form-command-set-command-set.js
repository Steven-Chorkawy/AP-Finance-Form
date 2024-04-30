define("5e9cf850-d844-48e5-9f34-46f1129ffc3e_0.1.0", ["@microsoft/sp-dialog","@microsoft/sp-listview-extensibility","@microsoft/sp-core-library"], function(__WEBPACK_EXTERNAL_MODULE__Cqt__, __WEBPACK_EXTERNAL_MODULE__7wVe__, __WEBPACK_EXTERNAL_MODULE_UWqr__) { return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
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
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "cqlJ");
/******/ })
/************************************************************************/
/******/ ({

/***/ "/Cqt":
/*!***************************************!*\
  !*** external "@microsoft/sp-dialog" ***!
  \***************************************/
/*! no static exports found */
/*! exports used: Dialog */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__Cqt__;

/***/ }),

/***/ "7wVe":
/*!*******************************************************!*\
  !*** external "@microsoft/sp-listview-extensibility" ***!
  \*******************************************************/
/*! no static exports found */
/*! exports used: BaseListViewCommandSet */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__7wVe__;

/***/ }),

/***/ "UWqr":
/*!*********************************************!*\
  !*** external "@microsoft/sp-core-library" ***!
  \*********************************************/
/*! no static exports found */
/*! exports used: Environment, EnvironmentType, Log, Version */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_UWqr__;

/***/ }),

/***/ "cqlJ":
/*!***********************************************************************!*\
  !*** ./lib/extensions/apFormCommandSet/ApFormCommandSetCommandSet.js ***!
  \***********************************************************************/
/*! exports provided: default */
/*! all exports used */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ApFormCommandSetCommandSet; });
/* harmony import */ var _microsoft_sp_core_library__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @microsoft/sp-core-library */ "UWqr");
/* harmony import */ var _microsoft_sp_core_library__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_microsoft_sp_core_library__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _microsoft_sp_listview_extensibility__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @microsoft/sp-listview-extensibility */ "7wVe");
/* harmony import */ var _microsoft_sp_listview_extensibility__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_microsoft_sp_listview_extensibility__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _microsoft_sp_dialog__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @microsoft/sp-dialog */ "/Cqt");
/* harmony import */ var _microsoft_sp_dialog__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_microsoft_sp_dialog__WEBPACK_IMPORTED_MODULE_2__);



const LOG_SOURCE = 'ApFormCommandSetCommandSet';
class ApFormCommandSetCommandSet extends _microsoft_sp_listview_extensibility__WEBPACK_IMPORTED_MODULE_1__["BaseListViewCommandSet"] {
    constructor() {
        super(...arguments);
        this._onListViewStateChanged = (args) => {
            var _a;
            _microsoft_sp_core_library__WEBPACK_IMPORTED_MODULE_0__["Log"].info(LOG_SOURCE, 'List view state changed');
            const compareOneCommand = this.tryGetCommand('COMMAND_1');
            if (compareOneCommand) {
                // This command should be hidden unless exactly one row is selected.
                compareOneCommand.visible = ((_a = this.context.listView.selectedRows) === null || _a === void 0 ? void 0 : _a.length) === 1;
            }
            // TODO: Add your logic here
            // You should call this.raiseOnChage() to update the command bar
            this.raiseOnChange();
        };
    }
    onInit() {
        _microsoft_sp_core_library__WEBPACK_IMPORTED_MODULE_0__["Log"].info(LOG_SOURCE, 'Initialized ApFormCommandSetCommandSet');
        // initial state of the command's visibility
        const compareOneCommand = this.tryGetCommand('COMMAND_1');
        compareOneCommand.visible = false;
        this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);
        return Promise.resolve();
    }
    onExecute(event) {
        switch (event.itemId) {
            case 'COMMAND_1':
                _microsoft_sp_dialog__WEBPACK_IMPORTED_MODULE_2__["Dialog"].alert(`${this.properties.sampleTextOne}`).catch(() => {
                    /* handle error */
                });
                break;
            case 'COMMAND_2':
                _microsoft_sp_dialog__WEBPACK_IMPORTED_MODULE_2__["Dialog"].alert(`${this.properties.sampleTextTwo}`).catch(() => {
                    /* handle error */
                });
                break;
            default:
                throw new Error('Unknown command');
        }
    }
}


/***/ })

/******/ })});;
//# sourceMappingURL=ap-form-command-set-command-set.js.map