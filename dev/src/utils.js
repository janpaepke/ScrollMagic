	/*
	 * ----------------------------------------------------------------
	 * global logging functions and making sure no console errors occur
	 * ----------------------------------------------------------------
	 */

	// (BUILD) - REMOVE IN MINIFY - START
	var debug = (function (console) {
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
	// a helper function that should generally be faster than jQuery.offset() and can also return position in relation to viewport.
	var getOffset = function (elem, relativeToViewport) {
		var offset = {top: 0, left: 0};
		elem = elem[0]; // tmp workaround until jQuery dependency is removed.
		if (elem && elem.getBoundingClientRect) { // check if available
			var rect = elem.getBoundingClientRect();
			offset.top = rect.top;
			offset.left = rect.left;
			if (!relativeToViewport) { // clientRect is by default relative to viewport...
				offset.top += (window.pageYOffset || document.scrollTop  || 0) - (document.clientTop  || 0);
				offset.left += (window.pageXOffset || document.scrollLeft  || 0) - (document.clientLeft || 0);
			}
		}
		return offset;
	};
	var isDomElement = function (o){
		return (
			typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
			o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
		);
	};
	var isMarginCollapseType = function (str) {
		return ["block", "flex", "list-item", "table", "-webkit-box"].indexOf(str) > -1;
	};
	// implementation of requestAnimationFrame
	var animationFrameCallback = window.requestAnimationFrame;
	var animationFrameCancelCallback = window.cancelAnimationFrame;

	// polyfill -> based on https://gist.github.com/paulirish/1579671
	(function (window) {
		var
			lastTime = 0,
			vendors = ['ms', 'moz', 'webkit', 'o'],
			i;

		// try vendor prefixes if the above doesn't work
		for (i = 0; !animationFrameCallback && i < vendors.length; ++i) {
			animationFrameCallback = window[vendors[i] + 'RequestAnimationFrame'];
			animationFrameCancelCallback = window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame'];
		}

		// fallbacks
		if (!animationFrameCallback) {
			animationFrameCallback = function (callback) {
				var
					currTime = new Date().getTime(),
					timeToCall = Math.max(0, 16 - (currTime - lastTime)),
					id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}
		if (!animationFrameCancelCallback) {
			animationFrameCancelCallback = function (id) {
				window.clearTimeout(id);
			};
		}
	}(window));