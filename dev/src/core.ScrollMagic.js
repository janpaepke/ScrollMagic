/**
@overview	##Info
@version	%VERSION%
@license	Dual licensed under MIT license and GPL.
@author		Jan Paepke - e-mail@janpaepke.de

@todo: bug: when cascading pins (pinning one element multiple times) and later removing them without reset, positioning errors occur.
@todo: bug: having multiple scroll directions with cascaded pins doesn't work (one scroll vertical, one horizontal)
@todo: bug: pin positioning problems with centered pins in IE9 (i.e. in examples)
@toto: improvement: check if its possible to take the recalculation of the start point out of the scene update, while still making sure it is always up to date (performance)
@todo: feature: consider public method to trigger pinspacerresize (in case size changes during pin)
@todo: feature: have different tweens, when scrolling up, than when scrolling down
@todo: feature: make pins work with -webkit-transform of parent for mobile applications. Might be possible by temporarily removing the pin element from its container and attaching it to the body during pin. Reverting might be difficult though (cascaded pins).
*/
(function($, window) {
	
	"use strict";

// INSERT POINT: class.ScrollMagic

// INSERT POINT: class.ScrollScene

	// make global references available
	window.ScrollScene = ScrollScene;
	window.ScrollMagic = ScrollMagic;

// INSERT POINT: utils

})(jQuery, window);