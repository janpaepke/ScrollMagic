/*!
 * @file ScrollMagic Velocity Animation Plugin.
 *
 * Powered by the VelocityJS: http://VelocityJS.org
 * Velocity is published under MIT license.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['ScrollMagic'], factory);
    } else {
        // Browser globals
        factory(root.ScrollMagic || (root.jQuery && root.jQuery.ScrollMagic));
    }
}(this, function(ScrollMagic) {

}));