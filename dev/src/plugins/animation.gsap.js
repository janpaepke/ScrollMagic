/*
	ScrollMagic GSAP Animation Plugin.

    Powered by the Greensock Tweening Platform (GSAP): http://www.greensock.com/js
    Greensock License info at http://www.greensock.com/licensing/
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