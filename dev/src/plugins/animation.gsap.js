/*
	@overview ScrollMagic Animation Extension for GSAP.
	@version	%VERSION%
	@license	Dual licensed under MIT license and GPL.
	@author		Jan Paepke - e-mail@janpaepke.de
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['ScrollScene'], factory);
    } else {
        // Browser globals
        factory(root.ScrollScene);
    }
}(this, function(ScrollScene) {

}));