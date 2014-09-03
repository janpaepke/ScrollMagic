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
(function($, window) {
	
	"use strict";

// (BUILD) - INSERT POINT: class.ScrollMagic

// (BUILD) - INSERT POINT: class.ScrollScene

	// store version
	ScrollMagic.prototype.version = "%VERSION%";
	// make global references available
	window.ScrollScene = ScrollScene;
	window.ScrollMagic = ScrollMagic;

// (BUILD) - INSERT POINT: utils

})(jQuery, window);