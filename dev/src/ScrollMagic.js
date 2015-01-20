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
		_util.log(2, '(COMPATIBILITY NOTICE) -> As of ScrollMagic 2.0.0 you need to use \'new ScrollMagic.Controller()\' to create a new controller instance. Use \'new ScrollMagic.Scene()\' to instance a scene.');
	};

	ScrollMagic.version = "%VERSION%";

// @include('ScrollMagic/Controller.js')

// @include('ScrollMagic/Scene.js')

// @include('ScrollMagic/Event.js')

// @include('ScrollMagic/_util.js')

// @generate PlugInWarnings

	return ScrollMagic;
}));