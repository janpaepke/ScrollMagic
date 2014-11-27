/*!
 * @file ScrollMagic GSAP Animation Plugin.
 *
 * Powered by the Greensock Animation Platform (GSAP): http://www.greensock.com/js
 * Greensock License info at http://www.greensock.com/licensing/
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['ScrollMagic'], factory);
    } else {
        // Browser globals
        factory(root.ScrollMagic);
    }
}(this, function(ScrollMagic) {

}));