/*!
 * @file ScrollMagic jQuery plugin.
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
	$.ScrollMagic = ScrollMagic;
}));