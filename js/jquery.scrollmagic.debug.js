/*!
 * ** WARNING ** WARNING ** WARNING **
 *
 * This file is only kept for compatibility purposes and scheduled for removal.
 * DO NOT use this resource for development or production environments.
 *
 * Please use CDNJS to get ScrollMagic.
 * Version 1.3.0: http://cdnjs.cloudflare.com/ajax/libs/ScrollMagic/1.3.0/jquery.scrollmagic.debug.js
 * Version 2.0.0: http://cdnjs.cloudflare.com/ajax/libs/ScrollMagic/2.0.0/plugins/debug.addIndicators.js
 */
var redirURL = window.location.protocol + '//cdnjs.cloudflare.com/ajax/libs/ScrollMagic/1.3.0/jquery.scrollmagic.debug.js';
(function(w, d, tagname, url){
    var
        script = d.createElement(tagname),
        firstScript = d.getElementsByTagName(tagname)[0],
        warn = Function.prototype.bind.call((w.console && (w.console.warn || w.console.log)) || w.alert, w.console || w);
    script.src = url;
    firstScript.parentNode.insertBefore(script, firstScript.nextSibling);
    w.setTimeout(warn, 500, "WARNING: Invalid network resource for ScrollMagic. Please use '" + url + "' instead!");
})(window, document, 'script', redirURL);