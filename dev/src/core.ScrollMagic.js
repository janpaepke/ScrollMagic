/**
@overview	##Info
@version	%VERSION%
@license	Dual licensed under MIT license and GPL.
@author		Jan Paepke - e-mail@janpaepke.de

@todo: enhancement: remove dependencies and move to plugins -> 2.0
@todo: bug: when cascading pins (pinning one element multiple times) and later removing them without reset, positioning errors occur.
@todo: bug: having multiple scroll directions with cascaded pins doesn't work (one scroll vertical, one horizontal)
@todo: feature: optimize performance on debug plugin (huge drawbacks, when using many scenes)
*/
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'TweenMax', 'TimelineMax'], factory);
	} else {
		// Browser globals
		var sm = factory(root.jQuery, root.TweenMax, root.TimelineMax);
		root.ScrollMagic = sm.Controller;
		root.ScrollScene = sm.Scene;
	}
}(this, function ($, TweenMax, TimelineMax) {

// (BUILD) - INSERT POINT: class.ScrollMagic

// (BUILD) - INSERT POINT: class.ScrollScene

// (BUILD) - INSERT POINT: utils

	return {
		Controller: ScrollMagic,
		Scene: ScrollScene,
	};
}));
