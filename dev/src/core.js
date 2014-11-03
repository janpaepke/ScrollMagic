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
(function(root) {
	
	"use strict";

	var define = root.define, ScrollMagic, ScrollScene;
  ScrollScene = ScrollMagic = function () {};
  if (typeof define !== 'function' || !define.amd) {
  	// No AMD loader -> Provide custom method to to register browser globals instead
  	define = function (moduleName, dependencies, factory) {
  		for (var x = 0; x<dependencies.length; x++) {
  			dependencies[x] = root[dependencies[x]];
  		}
  		root[moduleName] = factory.apply(root, dependencies);
  	};
  }

// (BUILD) - INSERT POINT: ScrollMagic

// (BUILD) - INSERT POINT: ScrollScene

// (BUILD) - INSERT POINT: utils

})(this || window);