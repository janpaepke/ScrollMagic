	/*
	 * ----------------------------------------------------------------
	 * global logging functions and making sure no console errors occur
	 * ----------------------------------------------------------------
	 */
	var
		console = (window.console = window.console || {}),
		loglevels = [
			"error",
			"warn",
			"log"
		];
	if (!console.log) {
		console.log = $.noop; // no console log, well - do nothing then...
	}
	$.each(loglevels, function (index, method) { // make sure methods for all levels exist.
		if (!console[method]) {
			console[method] = console.log; // prefer .log over nothing
		}
	});
	// debugging function
	var debug = function (loglevel) {
		if (loglevel > loglevels.length || loglevel <= 0) loglevel = loglevels.length;
		var now = new Date(),
			time = ("0"+now.getHours()).slice(-2) + ":" + ("0"+now.getMinutes()).slice(-2) + ":" + ("0"+now.getSeconds()).slice(-2) + ":" + ("00"+now.getMilliseconds()).slice(-3),
			method = loglevels[loglevel-1],
			args = Array.prototype.splice.call(arguments, 1),
			func = Function.prototype.bind.call(console[method], console);

		args.unshift(time);
		func.apply(console, args);
	};
	// a helper function that should generally be faster than jQuery.offset() and can also return position in relation to viewport.
	var getOffset = function ($elem, relativeToViewport) {
		var  offset = {
				top: 0,
				left: 0
			},
			elem = $elem[0];
		if (elem) {
			if (elem.getBoundingClientRect) { // check if available
				var  rect = elem.getBoundingClientRect();
				offset.top = rect.top;
				offset.left = rect.left;
				if (!relativeToViewport) { // clientRect is by default relative to viewport...
					offset.top += $(document).scrollTop();
					offset.left += $(document).scrollLeft();
				}
			} else { // fall back to jquery
				offset = $elem.offset() || offset; // if element has offset undefined (i.e. document) use 0 for top and left
				if (relativeToViewport) { // jquery.offset is by default NOT relative to viewport...
					offset.top -= $(document).scrollTop();
					offset.left -= $(document).scrollLeft();
				}
			}
		}
		return offset;
	};