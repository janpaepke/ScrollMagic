/*!
 * ScrollMagic v2.0.0-alpha (2014-11-07)
 * The javascript library for doing magical scroll interactions.
 * (c) 2014 Jan Paepke (@janpaepke)
 * Project Website: http://janpaepke.github.io/ScrollMagic
 * 
 * @version 2.0.0-alpha
 * @license Dual licensed under MIT license and GPL.
 * @author Jan Paepke - e-mail@janpaepke.de
 *
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