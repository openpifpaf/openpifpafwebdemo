(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Databench"] = factory();
	else
		root["Databench"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
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
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
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
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Databench
 */
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(1));
__export(__webpack_require__(5));


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var websocket_1 = __webpack_require__(2);
/**
 * Connection to the backend.
 *
 * The standard template is to create a connection first, then use it to
 * wire all UI elements, to add custom callback functions and at last to run
 * [[Connection.connect]] to create a WebSocket connection to the backend
 * server (see example below).
 *
 * The other two essential functions to know about are
 * [[Connection.on]] and [[Connection.emit]].
 *
 * Logging across frontend and backend can be done by emitting `log`,
 * `warn` or `error`, e.g. `emit('log', 'Hello World')`.
 *
 * ```js
 * var databench = new Databench.Connection();
 * Databench.ui.wire(databench);
 *
 *
 * // put custom d.on() methods here
 *
 *
 * databench.connect();
 * ```
 */
var Connection = /** @class */ (function () {
    /**
     * @param  wsUrl        URL of WebSocket endpoint or undefined to guess it.
     * @param  requestArgs  `search` part of request url or undefined to take from
     *                      `window.location.search`.
     * @param  analysisId   Specify an analysis id or undefined to have one generated.
     *                      The connection will try to connect to a previously created
     *                      analysis with that id.
     */
    function Connection(wsUrl, requestArgs, analysisId) {
        var _this = this;
        this.wsUrl = wsUrl || Connection.guessWSUrl();
        this.requestArgs = (!requestArgs && (typeof window !== 'undefined')) ?
            window.location.search : requestArgs;
        this.analysisId = analysisId;
        this.errorCB = function (msg) { return (msg != null ? console.log("connection error: " + msg) : null); };
        this.onCallbacks = {};
        this.onProcessCallbacks = {};
        this.preEmitCallbacks = {};
        this.connectCallback = function (connection) { };
        this.wsReconnectAttempt = 0;
        this.wsReconnectDelay = 100.0;
        // wire log, warn, error messages into console outputs
        ['log', 'warn', 'error'].forEach(function (wireSignal) {
            _this.on(wireSignal, function (message) { return console[wireSignal]('backend: ', message); });
            _this.preEmit(wireSignal, function (message) {
                console[wireSignal]('frontend: ', message);
                return message;
            });
        });
    }
    Connection.guessWSUrl = function () {
        if (typeof location === 'undefined')
            return '';
        var WSProtocol = location.origin.indexOf('https://') === 0 ? 'wss' : 'ws';
        var path = location.pathname.substring(0, location.pathname.lastIndexOf('/'));
        return WSProtocol + "://" + document.domain + ":" + location.port + path + "/ws";
    };
    /** initialize connection */
    Connection.prototype.connect = function (callback) {
        var _this = this;
        if (!this.wsUrl)
            throw Error('Need a wsUrl.');
        this.connectCallback = callback ? callback : function () { return _this; };
        this.socket = new websocket_1.w3cwebsocket(this.wsUrl);
        this.socketCheckOpen = setInterval(this.wsCheckOpen.bind(this), 2000);
        this.socket.onopen = this.wsOnOpen.bind(this);
        this.socket.onclose = this.wsOnClose.bind(this);
        this.socket.onmessage = this.wsOnMessage.bind(this);
        return this;
    };
    /** close connection */
    Connection.prototype.disconnect = function () {
        if (this.socketCheckOpen) {
            clearInterval(this.socketCheckOpen);
            this.socketCheckOpen = undefined;
        }
        if (this.socket) {
            this.socket.onclose = null;
            this.socket.close();
            this.socket = undefined;
        }
    };
    Connection.prototype.wsCheckOpen = function () {
        if (!this.socket)
            return;
        if (this.socket.readyState === this.socket.CONNECTING) {
            return;
        }
        if (this.socket.readyState !== this.socket.OPEN) {
            this.errorCB('Connection could not be opened. ' +
                'Please <a href="javascript:location.reload(true);" ' +
                'class="alert-link">reload</a> this page to try again.');
        }
        if (this.socketCheckOpen) {
            clearInterval(this.socketCheckOpen);
            this.socketCheckOpen = undefined;
        }
    };
    Connection.prototype.wsOnOpen = function () {
        if (!this.socket)
            return;
        this.wsReconnectAttempt = 0;
        this.wsReconnectDelay = 100.0;
        this.errorCB(); // clear errors
        this.socket.send(JSON.stringify({
            __connect: this.analysisId ? this.analysisId : null,
            __request_args: this.requestArgs,
        }));
    };
    Connection.prototype.wsOnClose = function () {
        if (this.socketCheckOpen) {
            clearInterval(this.socketCheckOpen);
            this.socketCheckOpen = undefined;
        }
        this.wsReconnectAttempt += 1;
        this.wsReconnectDelay *= 2;
        if (this.wsReconnectAttempt > 5) {
            this.errorCB('Connection closed. ' +
                'Please <a href="javascript:location.reload(true);" ' +
                'class="alert-link">reload</a> this page to reconnect.');
            return;
        }
        var actualDelay = 0.7 * this.wsReconnectDelay + 0.3 * Math.random() *
            this.wsReconnectDelay;
        console.log("WebSocket reconnect attempt " + this.wsReconnectAttempt + " " +
            ("in " + actualDelay.toFixed(0) + "ms."));
        setTimeout(this.connect.bind(this), actualDelay);
    };
    /**
     * Trigger all callbacks for this signal with this message.
     * @param signal  Name of the signal to trigger.
     * @param message Payload for the triggered signal.
     */
    Connection.prototype.trigger = function (signal, message) {
        this.onCallbacks[signal].forEach(function (cb) { return cb(message, signal); });
    };
    Connection.prototype.wsOnMessage = function (event) {
        var message = JSON.parse(event.data);
        // connect response
        if (message.signal === '__connect') {
            this.analysisId = message.load.analysis_id;
            this.databenchBackendVersion = message.load.databench_backend_version;
            var newVersion = message.load.analyses_version;
            if (this.analysesVersion && this.analysesVersion !== newVersion) {
                location.reload();
            }
            this.analysesVersion = newVersion;
            this.connectCallback(this);
        }
        // processes
        if (message.signal === '__process') {
            var id = message.load.id;
            var status_1 = message.load.status;
            this.onProcessCallbacks[id].forEach(function (cb) { return cb(status_1); });
        }
        // normal message
        if (message.signal in this.onCallbacks) {
            this.trigger(message.signal, message.load);
        }
    };
    /**
     * Register a callback that listens for a signal.
     *
     * The signal can be a simple string (the name for a signal/action), but it
     * can also be an Object of the form `{data: 'current_value'}` which would
     * trigger on `data` actions that are sending a JSON dictionary that contains
     * the key `current_value`. In this case, the value that is
     * given to the callback function is the value assigned to `current_value`.
     *
     * ~~~
     * d.on('data', value => { console.log(value); });
     * // If the backend sends an action called 'data' with a message
     * // {current_value: 3.0}, this function would log `{current_value: 3.0}`.
     * ~~~
     *
     * ~~~
     * d.on({data: 'current_value'}, value => { console.log(value); });
     * // If the backend sends an action called 'data' with a
     * // message {current_value: 3.0}, this function would log `3.0`.
     * // This callback is not triggered when the message does not contain a
     * // `current_value` key.
     * ~~~
     *
     * @param  signal    Signal name to listen for.
     * @param  callback  A callback function that takes the attached data.
     */
    Connection.prototype.on = function (signal, callback) {
        if (typeof signal === 'object') {
            this._on_object(signal, callback);
            return this;
        }
        if (!(signal in this.onCallbacks))
            this.onCallbacks[signal] = [];
        this.onCallbacks[signal].push(callback);
        return this;
    };
    /**
     * Listen for a signal once.
     *
     * Similar to [on] but returns a `Promise` instead of taking a callback.
     * This is mostly useful for unit tests.
     *
     * @param signal Signal name to listen for.
     */
    Connection.prototype.once = function (signal) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.on(signal, resolve);
        });
    };
    Connection.prototype._on_object = function (signal, callback) {
        var _this = this;
        Object.keys(signal).forEach(function (signalName) {
            var entryName = signal[signalName];
            var filteredCallback = function (data, signalName) {
                Object.keys(data).forEach(function (dataKey) {
                    if (dataKey.match(entryName) === null)
                        return;
                    callback(data[dataKey], dataKey);
                });
            };
            _this.on(signalName, filteredCallback);
        });
        return this;
    };
    /**
     * Set a pre-emit hook.
     * @param signalName  A signal name.
     * @param callback    Callback function.
     */
    Connection.prototype.preEmit = function (signalName, callback) {
        if (!(signalName in this.preEmitCallbacks))
            this.preEmitCallbacks[signalName] = [];
        this.preEmitCallbacks[signalName].push(callback);
        return this;
    };
    /**
     * Emit a signal/action to the backend.
     * @param  signalName  A signal name. Usually an action name.
     * @param  message     Payload attached to the action.
     */
    Connection.prototype.emit = function (signalName, message) {
        var _this = this;
        // execute preEmit hooks before sending message to backend
        if (signalName in this.preEmitCallbacks) {
            this.preEmitCallbacks[signalName].forEach(function (cb) {
                message = cb(message);
            });
        }
        // socket will never be open
        if (!this.socket)
            return this;
        // socket is not open yet
        if (this.socket.readyState !== this.socket.OPEN) {
            setTimeout(function () { return _this.emit(signalName, message); }, 5);
            return this;
        }
        // send to backend
        this.socket.send(JSON.stringify({ signal: signalName, load: message }));
        return this;
    };
    Connection.prototype.onProcess = function (processID, callback) {
        if (!(processID in this.onProcessCallbacks)) {
            this.onProcessCallbacks[processID] = [];
        }
        this.onProcessCallbacks[processID].push(callback);
        return this;
    };
    return Connection;
}());
exports.Connection = Connection;
/**
 * Create a Connection and immediately connect to it.
 *
 * This is a shorthand for
 * ~~~
 * new Connection(wsUrl, requestArgs, analysisId).connect();
 * ~~~
 *
 * Use this function in tests where you know that `connect()` will not trigger
 * any callbacks that you should listen to. In regular code, it is better
 * to define all `on` callbacks before calling `connect()` and so this
 * shorthand should not be used.
 *
 * @param wsUrl       URL of WebSocket endpoint or undefined to guess it.
 * @param requestArgs `search` part of request url or undefined to take from
 *                     `window.location.search`.
 * @param analysisId  Specify an analysis id or undefined to have one generated.
 *                    The connection will try to connect to a previously created
 *                    analysis with that id.
 * @param callback    Called when connection is established.
 */
function connect(wsUrl, requestArgs, analysisId, callback) {
    return new Connection(wsUrl, requestArgs, analysisId).connect(callback);
}
exports.connect = connect;
/**
 * Attach to a backend.
 *
 * Similar to [connect](globals.html#connect). Instead of a callback parameter, it
 * returns a Promise that resolves to a [[Connection]] instance once the connection is
 * established.
 *
 * @param wsUrl       URL of WebSocket endpoint or undefined to guess it.
 * @param requestArgs `search` part of request url or undefined to take from
 *                    `window.location.search`.
 * @param analysisId  Specify an analysis id or undefined to have one generated.
 *                    The connection will try to connect to a previously created
 *                    analysis with that id.
 */
function attach(wsUrl, requestArgs, analysisId) {
    var connection = new Connection(wsUrl, requestArgs, analysisId);
    return new Promise(function (resolve) { return connection.connect(resolve); });
}
exports.attach = attach;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var _global = function () {
	return this;
}();
var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;
var websocket_version = __webpack_require__(3);

/**
 * Expose a W3C WebSocket class with just one or two arguments.
 */
function W3CWebSocket(uri, protocols) {
	var native_instance;

	if (protocols) {
		native_instance = new NativeWebSocket(uri, protocols);
	} else {
		native_instance = new NativeWebSocket(uri);
	}

	/**
  * 'native_instance' is an instance of nativeWebSocket (the browser's WebSocket
  * class). Since it is an Object it will be returned as it is when creating an
  * instance of W3CWebSocket via 'new W3CWebSocket()'.
  *
  * ECMAScript 5: http://bclary.com/2004/11/07/#a-13.2.2
  */
	return native_instance;
}
if (NativeWebSocket) {
	['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function (prop) {
		Object.defineProperty(W3CWebSocket, prop, {
			get: function () {
				return NativeWebSocket[prop];
			}
		});
	});
}

/**
 * Module exports.
 */
module.exports = {
	'w3cwebsocket': NativeWebSocket ? W3CWebSocket : null,
	'version': websocket_version
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(4).version;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = {"_args":[[{"raw":"websocket@^1.0.25","scope":null,"escapedName":"websocket","name":"websocket","rawSpec":"^1.0.25","spec":">=1.0.25 <2.0.0","type":"range"},"/Users/zween/tech/databench"]],"_from":"websocket@>=1.0.25 <2.0.0","_id":"websocket@1.0.25","_inCache":true,"_location":"/websocket","_nodeVersion":"8.7.0","_npmOperationalInternal":{"host":"s3://npm-registry-packages","tmp":"tmp/websocket-1.0.25.tgz_1508372613263_0.2284609314519912"},"_npmUser":{"name":"theturtle32","email":"theturtle32@gmail.com"},"_npmVersion":"5.4.2","_phantomChildren":{},"_requested":{"raw":"websocket@^1.0.25","scope":null,"escapedName":"websocket","name":"websocket","rawSpec":"^1.0.25","spec":">=1.0.25 <2.0.0","type":"range"},"_requiredBy":["/"],"_resolved":"https://registry.npmjs.org/websocket/-/websocket-1.0.25.tgz","_shasum":"998ec790f0a3eacb8b08b50a4350026692a11958","_shrinkwrap":null,"_spec":"websocket@^1.0.25","_where":"/Users/zween/tech/databench","author":{"name":"Brian McKelvey","email":"brian@worlize.com","url":"https://www.worlize.com/"},"browser":"lib/browser.js","bugs":{"url":"https://github.com/theturtle32/WebSocket-Node/issues"},"config":{"verbose":false},"contributors":[{"name":"Iñaki Baz Castillo","email":"ibc@aliax.net","url":"http://dev.sipdoc.net"}],"dependencies":{"debug":"^2.2.0","nan":"^2.3.3","typedarray-to-buffer":"^3.1.2","yaeti":"^0.0.6"},"description":"Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.","devDependencies":{"buffer-equal":"^1.0.0","faucet":"^0.0.1","gulp":"git+https://github.com/gulpjs/gulp.git#4.0","gulp-jshint":"^2.0.4","jshint":"^2.0.0","jshint-stylish":"^2.2.1","tape":"^4.0.1"},"directories":{"lib":"./lib"},"dist":{"integrity":"sha512-M58njvi6ZxVb5k7kpnHh2BvNKuBWiwIYvsToErBzWhvBZYwlEiLcyLrG41T1jRcrY9ettqPYEqduLI7ul54CVQ==","shasum":"998ec790f0a3eacb8b08b50a4350026692a11958","tarball":"https://registry.npmjs.org/websocket/-/websocket-1.0.25.tgz"},"engines":{"node":">=0.10.0"},"gitHead":"d941f975e8ef6b55eafc0ef45996f4198013832c","homepage":"https://github.com/theturtle32/WebSocket-Node","keywords":["websocket","websockets","socket","networking","comet","push","RFC-6455","realtime","server","client"],"license":"Apache-2.0","main":"index","maintainers":[{"name":"theturtle32","email":"brian@worlize.com"}],"name":"websocket","optionalDependencies":{},"readme":"ERROR: No README data found!","repository":{"type":"git","url":"git+https://github.com/theturtle32/WebSocket-Node.git"},"scripts":{"gulp":"gulp","install":"(node-gyp rebuild 2> builderror.log) || (exit 0)","test":"faucet test/unit"},"version":"1.0.25"}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * This is a basic set of UI elements to create analyses without having to add
 * frontend frameworks like Angular or React.
 *
 * @module ui
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ui;
(function (ui) {
    /**
     * Abstract class for user interface elements which provides general helpers
     * to determine the action name from an HTML tag and a way to modify the message
     * that is sent with actions of wired elements.
     *
     * The constructor adds the variables `actionName` and `wireSignal` using
     * [[UIElement.determineActionName]] and
     * [[UIElement.determineWireSignal]] respectively.
     * It also adds `this` UI element to the DOM node at `databenchUI`.
     */
    var UIElement = /** @class */ (function () {
        /**
         * @param node  An HTML element.
         */
        function UIElement(node) {
            this.node = node;
            this.node.databenchUI = this;
            this.idCount = UIElement.idCounter++;
            this.actionName = this.determineActionName(node);
            this.wireSignal = this.determineWireSignal(node);
        }
        /**
         * Formats the payload of an action.
         * @param  value Original payload.
         * @return       Modified payload.
         */
        UIElement.prototype.actionFormat = function (value) {
            return value;
        };
        /**
         * Determine whether to skip this element.
         *
         * This can be forced by adding a `data-skipwire=true` attribute
         * to the HTML tag.
         *
         * @param node A HTML element.
         */
        UIElement.skipWire = function (node) {
            return (node.dataset.skipwire === 'true' ||
                node.dataset.skipwire === 'TRUE' ||
                node.dataset.skipwire === '1');
        };
        /**
         * Determine the name of the action that should be associated with the node.
         *
         * The action name is determined from
         * the tag's `data-action`, `name` or `id` attribute (in that order).
         *
         * @param  node A HTML element.
         * @return      Name of action or null.
         */
        UIElement.prototype.determineActionName = function (node) {
            var dataAction = node.dataset.action;
            if (dataAction)
                return dataAction;
            var attrName = node.getAttribute('name');
            if (attrName)
                return attrName;
            var attrId = node.getAttribute('id');
            if (attrId)
                return attrId;
            return 'element' + this.idCount;
        };
        /**
         * Determine the name of the signal that should be listened to from the backend.
         *
         * The signal name is determined from the `data-signal`,
         * `data-action`, `name` or `id` attribute (in that order.)
         * For all attributes apart from `data-signal`, the value is wrapped in an
         * object like `{ data: value-of-attribute }`. The `data-signal` value
         * can contain a `:` which will be used to create an object as well. That means
         * that `data-signal="data:myvalue"` gives the same result as `data-action="myvalue"`.
         *
         * @param  node A HTML element.
         * @return      Name of a signal or null.
         */
        UIElement.prototype.determineWireSignal = function (node) {
            var dataSignal = node.dataset.signal;
            if (dataSignal) {
                if (dataSignal.indexOf(':') >= 1) {
                    var _a = dataSignal.split(':', 2), key = _a[0], value = _a[1];
                    return _b = {}, _b[key] = value, _b;
                }
                return dataSignal;
            }
            var dataAction = node.dataset.action;
            if (dataAction)
                return { data: dataAction };
            var attrName = node.getAttribute('name');
            if (attrName)
                return { data: attrName };
            var attrId = node.getAttribute('id');
            if (attrId)
                return { data: attrId };
            return { data: 'element' + this.idCount };
            var _b;
        };
        UIElement.idCounter = 0;
        return UIElement;
    }());
    ui.UIElement = UIElement;
    /**
     * Shows all `console.log()` messages and `log` actions from backend.
     *
     * Usually wired to a `<pre id="log">` element.
     */
    var Log = /** @class */ (function (_super) {
        __extends(Log, _super);
        /**
         * @param  node            Primary node.
         * @param  limitNumber     Maximum number of messages to show.
         * @param  limitLength     Maximum length of a message.
         */
        function Log(node, limitNumber, limitLength) {
            if (limitNumber === void 0) { limitNumber = 20; }
            if (limitLength === void 0) { limitLength = 250; }
            var _this = _super.call(this, node) || this;
            _this.limitNumber = limitNumber;
            _this.limitLength = limitLength;
            _this._messages = [];
            return _this;
        }
        Log.prototype.render = function () {
            var _this = this;
            while (this._messages.length > this.limitNumber)
                this._messages.shift();
            this.node.innerText = this._messages
                .map(function (m) { return m.join(''); })
                .map(function (m) { return ((m.length > _this.limitLength)
                ? m.substr(0, _this.limitLength) + " ..."
                : m); })
                .join('\n');
            return this;
        };
        Log.prototype.add = function (message, source) {
            if (source === void 0) { source = 'unknown'; }
            var msg = typeof message === 'string' ? message : JSON.stringify(message);
            var paddedSource = Array(Math.max(0, 8 - source.length)).join(' ') + source;
            this._messages.push([paddedSource + ": " + msg]);
            this.render();
            return this;
        };
        /** Wire all logs. */
        Log.wire = function (conn, id, wireSignals, limitNumber, limitLength) {
            if (id === void 0) { id = 'log'; }
            if (wireSignals === void 0) { wireSignals = ['log', 'warn', 'error']; }
            if (limitNumber === void 0) { limitNumber = 20; }
            if (limitLength === void 0) { limitLength = 250; }
            var node = document.getElementById(id);
            if (node == null || UIElement.skipWire(node))
                return;
            var log = new Log(node, limitNumber, limitLength);
            console.log("Wiring " + wireSignals + " to ", node);
            wireSignals.forEach(function (wireSignal) {
                conn.on(wireSignal, function (message) {
                    log.add(message, "backend (" + wireSignal + ")");
                });
                conn.preEmit(wireSignal, function (message) {
                    log.add(message, "frontend (" + wireSignal + ")");
                    return message;
                });
            });
            return;
        };
        return Log;
    }(UIElement));
    ui.Log = Log;
    /**
     * Visual representation of alerts like connection failures.
     *
     * Usually wired to a `<div id="databench-alerts">` element.
     */
    var StatusLog = /** @class */ (function (_super) {
        __extends(StatusLog, _super);
        /**
         * @param  node       HTML node.
         * @param  formatter  Formats a message and a count to a string.
         */
        function StatusLog(node, formatter) {
            if (formatter === void 0) { formatter = StatusLog.defaultAlert; }
            var _this = _super.call(this, node) || this;
            _this.formatter = formatter;
            _this._messages = {};
            return _this;
        }
        /**
         * The default formatter function
         * @param  message   A message.
         * @param  count     Count of the message.
         * @returns HTML formatted version of the inputs.
         */
        StatusLog.defaultAlert = function (message, count) {
            var countFormat = count <= 1 ? '' : "<b>(" + count + ")</b> ";
            return "<div class=\"alert alert-danger\">" + countFormat + message + "</div>";
        };
        StatusLog.prototype.render = function () {
            var _this = this;
            var formatted = Object.getOwnPropertyNames(this._messages)
                .map(function (m) { return _this.formatter(m, _this._messages[m]); });
            this.node.innerHTML = formatted.join('\n');
            return this;
        };
        StatusLog.prototype.add = function (message) {
            if (message == null) {
                this._messages = {};
                return this;
            }
            var msg = typeof message === 'string' ? message : JSON.stringify(message);
            if (this._messages[msg] !== undefined) {
                this._messages[msg] += 1;
            }
            else {
                this._messages[msg] = 1;
            }
            this.render();
            return this;
        };
        /** Wire all status logs. */
        StatusLog.wire = function (conn, id, formatter) {
            if (id === void 0) { id = 'databench-alerts'; }
            if (formatter === void 0) { formatter = StatusLog.defaultAlert; }
            var node = document.getElementById(id);
            if (node == null)
                return;
            if (UIElement.skipWire(node))
                return;
            console.log('Wiring status log', node, "to element with id=" + id + ".");
            var l = new StatusLog(node, formatter);
            conn.errorCB = l.add.bind(l);
        };
        return StatusLog;
    }(UIElement));
    ui.StatusLog = StatusLog;
    var ButtonState;
    (function (ButtonState) {
        ButtonState[ButtonState["Idle"] = 1] = "Idle";
        ButtonState[ButtonState["Active"] = 2] = "Active";
    })(ButtonState = ui.ButtonState || (ui.ButtonState = {}));
    /**
     * A button, and usually wired to any `<button>` with an action name.
     *
     * This button also binds to process IDs of the backend. That means
     * that the button is disabled (using the CSS class `disabled`) while the
     * backend is processing the action that got started when it was clicked.
     * A simple example is below.
     *
     * In `index.html`:
     * ```html
     * <button data-action="run">Run</button>
     * ```
     *
     * In `analysis.py`:
     * ```py
     * @ databench.on
     * def run(self):
     *     """Run when button is pressed."""
     *     pass
     * ```
     *
     * In this form, Databench finds the button automatically and connects it
     * to the backend. No additional JavaScript code is required.
     */
    var Button = /** @class */ (function (_super) {
        __extends(Button, _super);
        /**
         * @param node   DOM node to connect.
         */
        function Button(node) {
            var _this = _super.call(this, node) || this;
            _this._state = ButtonState.Idle;
            _this.node.addEventListener('click', _this.click.bind(_this), false);
            return _this;
        }
        /**
         * Called on click events. When a button is wired, this function is overwritten
         * with the actual function that is triggered on click events.
         * @param  processID   a random id for the process that could be started
         */
        Button.prototype.clickCB = function (processID) {
            return console.log("click on " + this.node + " with " + processID);
        };
        Button.prototype.render = function () {
            switch (this._state) {
                case ButtonState.Active:
                    this.node.classList.add('disabled');
                    break;
                default:
                    this.node.classList.remove('disabled');
            }
            return this;
        };
        Button.prototype.click = function () {
            if (this._state !== ButtonState.Idle)
                return this;
            var processID = Math.floor(Math.random() * 0x100000);
            this.clickCB(processID);
            return this;
        };
        Button.prototype.state = function (s) {
            if (s !== ButtonState.Idle && s !== ButtonState.Active)
                return this;
            this._state = s;
            this.render();
            return this;
        };
        /** Wire all buttons. */
        Button.wire = function (conn, root) {
            if (root === undefined)
                root = document;
            var elements = [].slice.call(root.getElementsByTagName('BUTTON'), 0);
            elements
                .filter(function (node) { return node.databenchUI === undefined; })
                .filter(function (node) { return !UIElement.skipWire(node); })
                .forEach(function (node) {
                var b = new Button(node);
                console.log('Wiring button', node, "to action " + b.actionName + ".");
                // set up click callback
                b.clickCB = function (processID) {
                    // set up process callback
                    conn.onProcess(processID, function (status) { return b.state(
                    // map process status to state
                    { start: ButtonState.Active, end: ButtonState.Idle }[status]); });
                    conn.emit(b.actionName, b.actionFormat({
                        __process_id: processID,
                    }));
                };
            });
        };
        return Button;
    }(UIElement));
    ui.Button = Button;
    /**
     * Data bound text elements.
     *
     * Wired to `<span>`, `<p>`, `<div>`, `<i>` and `<b>` tags with a
     * `data-action` attribute specifying the action name.
     */
    var Text = /** @class */ (function (_super) {
        __extends(Text, _super);
        function Text() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Format the value.
         *
         * The default implementation returns a `JSON.stringify()` version for values
         * that are `typeof value == 'object'`. Otherwise it passes the value through.
         *
         * @param  value  Value as represented in the backend.
         * @return Formatted representation of the value.
         */
        Text.prototype.formatFn = function (value) {
            if (typeof value === 'object') {
                return JSON.stringify(value, undefined, 2);
            }
            return value;
        };
        /** Reads the value. */
        Text.prototype.getValue = function () {
            return this.node.innerHTML;
        };
        /** Reads the value. */
        Text.prototype.setValue = function (v) {
            this.node.innerHTML = this.formatFn(v || '');
            return this;
        };
        /**
         * Wire all text.
         * @param  {Connection} conn Connection to use.
         */
        Text.wire = function (conn, root) {
            if (root === undefined)
                root = document;
            var elements = [].concat([].slice.call(root.getElementsByTagName('SPAN'), 0), [].slice.call(root.getElementsByTagName('P'), 0), [].slice.call(root.getElementsByTagName('DIV'), 0), [].slice.call(root.getElementsByTagName('I'), 0), [].slice.call(root.getElementsByTagName('B'), 0), [].slice.call(root.getElementsByTagName('PRE'), 0));
            elements
                .filter(function (node) { return node.databenchUI === undefined; })
                .filter(function (node) { return node.dataset['action'] !== undefined; })
                .filter(function (node) { return !UIElement.skipWire(node); })
                .forEach(function (node) {
                var t = new Text(node);
                console.log('Wiring text', node, "to action " + t.actionName + ".");
                // handle events from backend
                conn.on(t.wireSignal, function (message) { return t.setValue(message); });
            });
        };
        return Text;
    }(UIElement));
    ui.Text = Text;
    /** Make an `<input[type='text']>` with an action name interactive. */
    var TextInput = /** @class */ (function (_super) {
        __extends(TextInput, _super);
        /**
         * @param node  The node to connect.
         */
        function TextInput(node) {
            var _this = _super.call(this, node) || this;
            _this._triggerOnKeyUp = false;
            _this.node.addEventListener('change', _this.change.bind(_this), false);
            return _this;
        }
        /**
         * Format the value.
         * @param  value  Value as represented in the backend.
         * @return Formatted representation of the value.
         */
        TextInput.prototype.formatFn = function (value) {
            return value;
        };
        /**
         * Callback that is triggered on frontend changes.
         * @param  value  A formatted action.
         */
        TextInput.prototype.changeCB = function (value) {
            return console.log("change of " + this.node + ": " + value);
        };
        TextInput.prototype.change = function () {
            return this.changeCB(this.actionFormat(this.getValue()));
        };
        /**
         * The default is `false`, which means that the callback is only triggered on
         * `change` events (i.e. pressing enter or unfocusing the element).
         * Setting this to true will trigger on every `keyup` event of this element.
         *
         * @param  v Whether to trigger on `keyup` events. Default is true.
         * @return self
         */
        TextInput.prototype.triggerOnKeyUp = function (v) {
            if (v !== false && !this._triggerOnKeyUp) {
                this.node.addEventListener('keyup', this.change.bind(this), false);
                this._triggerOnKeyUp = true;
            }
            if (v === false && this._triggerOnKeyUp) {
                this.node.removeEventListener('keyup', this.change.bind(this), false);
                this._triggerOnKeyUp = false;
            }
            return this;
        };
        /** Reads and sets the value. */
        TextInput.prototype.getValue = function () {
            return this.node.value;
        };
        /** Set value */
        TextInput.prototype.setValue = function (v) {
            this.node.value = this.formatFn(v || '');
            return this;
        };
        /** Wire all text inputs. */
        TextInput.wire = function (conn, root) {
            if (root === undefined)
                root = document;
            var elements = [].slice.call(root.getElementsByTagName('INPUT'), 0);
            elements
                .filter(function (node) { return node.databenchUI === undefined; })
                .filter(function (node) { return node.getAttribute('type') === 'text'; })
                .filter(function (node) { return !UIElement.skipWire(node); })
                .forEach(function (node) {
                var t = new TextInput(node);
                console.log('Wiring text input', node, "to action " + t.actionName + ".");
                // handle events from frontend
                t.changeCB = function (message) { return conn.emit(t.actionName, message); };
                // handle events from backend
                conn.on(t.wireSignal, function (message) { return t.setValue(message); });
            });
        };
        return TextInput;
    }(UIElement));
    ui.TextInput = TextInput;
    /**
     * Make all `<input[type='range']>` with an action name interactive.
     *
     * In `index.html`:
     * ```html
     * <label for="samples">Samples:</label>
     * <input type="range" id="samples" value="1000" min="100" max="10000" step="100" />
     * ```
     *
     * In `analysis.py`:
     * ```py
     * @ databench.on
     * def samples(self, value):
     *     """Sets the number of samples to generate per run."""
     *     yield self.set_state(samples=value)
     * ```
     */
    var Slider = /** @class */ (function (_super) {
        __extends(Slider, _super);
        /**
         * @param  node       DOM node to bind.
         * @param  labelNode  DOM node label that corresponds to the slider.
         */
        function Slider(node, labelNode) {
            var _this = _super.call(this, node) || this;
            _this.labelNode = labelNode;
            _this.labelHtml = labelNode ? labelNode.innerHTML : '';
            _this.node.addEventListener('input', _this.render.bind(_this), false);
            _this.node.addEventListener('change', _this.change.bind(_this), false);
            _this.render();
            return _this;
        }
        /**
         * Callback with changes to the slider value.
         * @param  value   Value from a sliderToValue() transform.
         */
        Slider.prototype.changeCB = function (value) {
            return console.log("slider value change: " + value);
        };
        /**
         * Transform a backend value to a slider value.
         * @param   value  Value as stored in backend.
         * @return  Value for the HTML range element.
         */
        Slider.prototype.valueToSlider = function (value) {
            return value.toString();
        };
        /**
         * Transform a value from the HTML range element to a value that should be stored.
         * @param  s  Value from HTML range element.
         * @return Value to store.
         */
        Slider.prototype.sliderToValue = function (s) {
            return s;
        };
        /**
         * How a value should be represented.
         * For example, this can add units or convert from radians to degrees.
         * @param  value  Input value as it is stored in the backend.
         * @return Representation of a value.
         */
        Slider.prototype.formatFn = function (value) {
            return value.toString();
        };
        Slider.prototype.render = function () {
            var v = this.getValue();
            if (this.labelNode) {
                this.labelNode.innerHTML = this.labelHtml + " " + this.formatFn(v);
            }
            return this;
        };
        /** Reads the value. */
        Slider.prototype.getValue = function () {
            return this.sliderToValue(parseFloat(this.node.value));
        };
        /** Set the value. */
        Slider.prototype.setValue = function (v) {
            var newSliderValue = this.valueToSlider(v);
            if (this.node.value === newSliderValue)
                return this;
            this.node.value = newSliderValue;
            this.render();
            return this;
        };
        Slider.prototype.change = function () {
            return this.changeCB(this.actionFormat(this.getValue()));
        };
        /** Find all labels for slider elements. */
        Slider.labelsForSliders = function (root) {
            var map = {};
            var elements = [].slice.call(root.getElementsByTagName('LABEL'), 0);
            elements
                .filter(function (label) { return label.htmlFor; })
                .forEach(function (label) { map[label.htmlFor] = label; });
            return map;
        };
        /** Wire all sliders. */
        Slider.wire = function (conn, root) {
            if (root === undefined)
                root = document;
            var lfs = this.labelsForSliders(root);
            var elements = [].slice.call(root.getElementsByTagName('INPUT'), 0);
            elements
                .filter(function (node) { return node.databenchUI === undefined; })
                .filter(function (node) { return node.getAttribute('type') === 'range'; })
                .filter(function (node) { return !UIElement.skipWire(node); })
                .forEach(function (node) {
                var slider = new Slider(node, lfs[node.id]);
                console.log('Wiring slider', node, "to action " + slider.actionName + ".");
                // handle events from frontend
                slider.changeCB = function (message) { return conn.emit(slider.actionName, message); };
                // handle events from backend
                conn.on(slider.wireSignal, function (message) { return slider.setValue(message); });
            });
        };
        return Slider;
    }(UIElement));
    ui.Slider = Slider;
    /**
     * Connect an `<img>` with a signal name to the backend.
     *
     * The signal message is placed directly into the `src` attribute of the image
     * tag. For matplotlib, that formatting can be done with the utility function
     * `fig_to_src()` (see example below).
     *
     * In `index.html`:
     * ```html
     * <img alt="my plot" data-signal="mpl" />
     * ```
     *
     * In `analysis.py`:
     * ```py
     * import matplotlib.pyplot as plt
     * ...
     * fig = plt.figure()
     * ...
     * self.emit('mpl', databench.fig_to_src(fig))
     * ```
     */
    var Image = /** @class */ (function (_super) {
        __extends(Image, _super);
        function Image() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Image.prototype.getSrc = function () {
            return this.node.src;
        };
        /** Sets theSrc. */
        Image.prototype.setSrc = function (v) {
            this.node.src = v;
            return this;
        };
        /** Wire all text inputs. */
        Image.wire = function (conn, root) {
            if (root === undefined)
                root = document;
            var elements = [].slice.call(root.getElementsByTagName('IMG'), 0);
            elements
                .filter(function (node) { return node.databenchUI === undefined; })
                .filter(function (node) { return node.dataset['signal'] !== undefined; })
                .filter(function (node) { return !UIElement.skipWire(node); })
                .forEach(function (node) {
                var img = new Image(node);
                console.log('Wiring image', node, "to signal " + img.wireSignal + ".");
                // handle events from backend
                conn.on(img.wireSignal, function (message) { return img.setSrc(message); });
            });
        };
        return Image;
    }(UIElement));
    ui.Image = Image;
    /**
     * Wire all the UI elements to the backend. The action name is determined by
     * [[UIElement.determineActionName]] and the action message can be modified
     * by overwriting [[UIElement.actionFormat]]. The signal name is determined by
     * [[UIElement.determineWireSignal]].
     *
     * @param  connection  A Databench.Connection instance.
     * @return The same connection.
     */
    function wire(connection, root) {
        StatusLog.wire(connection);
        Button.wire(connection, root);
        TextInput.wire(connection, root);
        Text.wire(connection, root);
        Slider.wire(connection, root);
        Image.wire(connection, root);
        Log.wire(connection);
        return connection;
    }
    ui.wire = wire;
})(ui = exports.ui || (exports.ui = {})); // namespace ui


/***/ })
/******/ ]);
});
//# sourceMappingURL=databench.js.map