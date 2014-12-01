/*!
 * @file ScrollMagic main library.
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(factory);
	} else {
		// Browser global
		root.ScrollMagic = factory();
	}
}(this, function () {
	"use strict";

	var ScrollMagic = function () {

	};

	ScrollMagic.version = "%VERSION%";

// @include('ScrollMagic/Controller.js')

// @include('ScrollMagic/Scene.js')

// @include('ScrollMagic/Event.js')

// @include('ScrollMagic/_util.js')

	return ScrollMagic;
}));