/*!
 * @file ScrollMagic main library.
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['TweenMax', 'TimelineMax'], factory);
	} else {
		// Browser globals
		var sm = factory(root.TweenMax, root.TimelineMax);
		root.ScrollMagic = sm.Controller;
		root.ScrollScene = sm.Scene;
	}
}(this, function (TweenMax, TimelineMax) {
	"use strict";

// include('ScrollMagic/Controller.js')

// include('ScrollMagic/Scene.js')

// include('ScrollMagic/_utils.js')

	return {
		Controller: ScrollMagic,
		Scene: ScrollScene,
	};
}));