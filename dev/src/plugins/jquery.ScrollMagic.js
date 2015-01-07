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
	}
}(this, function (ScrollMagic, $) {
	"use strict";
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