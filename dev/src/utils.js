	/*
	 * ----------------------------------------------------------------
	 * global logging functions and making sure no console errors occur
	 * ----------------------------------------------------------------
	 */

	// (BUILD) - REMOVE IN MINIFY - START
	var __debug = (function (console) {
		var loglevels = ["error", "warn", "log"];
		if (!console.log) {
			console.log = function(){}; // no console log, well - do nothing then...
		}
		for(var i = 0, method; i<loglevels.length; i++) { // make sure methods for all levels exist.
			method = loglevels[i];
			if (!console[method]) {
				console[method] = console.log; // prefer .log over nothing
			}
		}
		// debugging function
		return function (loglevel) {
			if (loglevel > loglevels.length || loglevel <= 0) loglevel = loglevels.length;
			var now = new Date(),
				time = ("0"+now.getHours()).slice(-2) + ":" + ("0"+now.getMinutes()).slice(-2) + ":" + ("0"+now.getSeconds()).slice(-2) + ":" + ("00"+now.getMilliseconds()).slice(-3),
				method = loglevels[loglevel-1],
				args = Array.prototype.splice.call(arguments, 1),
				func = Function.prototype.bind.call(console[method], console);

			args.unshift(time);
			func.apply(console, args);
		};
	}(window.console = window.console || {}));
	// (BUILD) - REMOVE IN MINIFY - END
	// type checkers
	var __type = function (v) {
		return Object.prototype.toString.call(v).replace(/^\[object (.+)\]$/, "$1").toLowerCase();
	};
	var __isString = function (v) {
		return __type(v) === 'string';
	};
	var __isFunction = function (v) {
		return __type(v) === 'function';
	};
	var __isArray = function (v) {
		return Array.isArray(v);
	};
	var __isNumber = function (v) {
		return !__isArray(v) && (v - parseFloat(v) + 1) >= 0;
	};
	var __isDomElement = function (o){
		return (
			typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
			o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
		);
	};
	// used to check if a display type has margin collapse or not
	var __isMarginCollapseType = function (str) {
		return ["block", "flex", "list-item", "table", "-webkit-box"].indexOf(str) > -1;
	};

	// helpers
	var __extend = function (out) {
		out = out || {};
		for (var i = 1; i < arguments.length; i++) {
			if (!arguments[i]) {
				continue;
			}
			for (var key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					out[key] = arguments[i][key];
				}
			}
		}
		return out;
	};

	// find an element in an array
	var __inArray = function(needle, haystack) {
		return haystack.indexOf(needle);
	};

	// get scroll top value
	var __getScrollTop = function (elem) {
		elem = elem || document;
		return (window.pageYOffset || elem.scrollTop  || 0) - (elem.clientTop  || 0);
	};
	// get scroll left value
	var __getScrollLeft = function (elem) {
		elem = elem || document;
		return (window.pageXOffset || elem.scrollLeft  || 0) - (elem.clientLeft  || 0);
	};
	// get inner height
	var __getHeight = function (elem) {
		return elem.clientHeight || elem.innerHeight || 0;
	};
	// get inner width
	var __getWidth = function (elem) {
		return elem.clientWidth || elem.innerWidth || 0;
	};

	// get element position (optionally relative to viewport)
	var __getOffset = function (elem, relativeToViewport) {
		var offset = {top: 0, left: 0};
		if (elem && elem.getBoundingClientRect) { // check if available
			var rect = elem.getBoundingClientRect();
			offset.top = rect.top;
			offset.left = rect.left;
			if (!relativeToViewport) { // clientRect is by default relative to viewport...
				offset.top += __getScrollTop();
				offset.left += __getScrollLeft();
			}
		}
		return offset;
	};

	// normalizes node lists, elements and selectors to arrays of elements
	var __getElements = function (selector) {
		var arr = [];
		if (__isString(selector)) {
			selector = document.querySelectorAll(selector);
		}
		if (__type(selector) === 'nodelist') {
			for (var i = 0, ref = arr.length = selector.length; i < ref; i++) {
				arr[i] = selector[i]; // array of elements
			}
		} else if (__isDomElement(selector) || selector === document || selector === window){
			arr = [selector]; // only the element
		}

		return arr;
	};

	// implementation of requestAnimationFrame
	var __animationFrameCallback = window.requestAnimationFrame;
	var __animationFrameCancelCallback = window.cancelAnimationFrame;

	// polyfill -> based on https://gist.github.com/paulirish/1579671
	(function (window) {
		var
			lastTime = 0,
			vendors = ['ms', 'moz', 'webkit', 'o'],
			i;

		// try vendor prefixes if the above doesn't work
		for (i = 0; !__animationFrameCallback && i < vendors.length; ++i) {
			__animationFrameCallback = window[vendors[i] + 'RequestAnimationFrame'];
			__animationFrameCancelCallback = window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame'];
		}

		// fallbacks
		if (!__animationFrameCallback) {
			__animationFrameCallback = function (callback) {
				var
					currTime = new Date().getTime(),
					timeToCall = Math.max(0, 16 - (currTime - lastTime)),
					id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}
		if (!__animationFrameCancelCallback) {
			__animationFrameCancelCallback = function (id) {
				window.clearTimeout(id);
			};
		}
	}(window));