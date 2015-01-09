/*!
 * @file ScrollMagic jQuery plugin.
 *
 * requires: jQuery ~1.11
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['ScrollMagic', 'jquery'], factory);
	} else {
		// Browser global
		factory(root.ScrollMagic, root.jQuery);
		delete root.ScrollMagic;
	}
}(this, function (ScrollMagic, $) {
	"use strict";
	var NAMESPACE = "jquery.ScrollMagic";

	// (BUILD) - REMOVE IN MINIFY - START
	var err = Function.prototype.bind.call((console && console.error || console.log) || function() {}, console);
	if (!ScrollMagic) {
		err("(" + NAMESPACE + ") -> ERROR: The ScrollMagic main module could not be found. Please make sure it's loaded before this plugin or use an asynchronous loader like requirejs.");
	}
	if (!$) {
		err("(" + NAMESPACE + ") -> ERROR: jQuery could not be found. Please make sure it's loaded before ScrollMagic or use an asynchronous loader like requirejs.");
	}
	// (BUILD) - REMOVE IN MINIFY - END

	ScrollMagic._util.get.elements = function (selector) {
		return $(selector).toArray();
	};
	ScrollMagic._util.addClass = function (elem, classname) {
		$(elem).addClass(classname);
	};
	ScrollMagic._util.removeClass = function (elem, classname) {
		$(elem).removeClass(classname);
	};
	$.ScrollMagic = ScrollMagic;
}));