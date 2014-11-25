/*!
 * @file ScrollMagic Velocity Animation Plugin.
 *
 * Powered by the VelocityJS: http://VelocityJS.org
 * Velocity is published under MIT license.
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