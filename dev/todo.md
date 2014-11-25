# Source
 - change name structure
 - make utils externally available
 - make ScrollMagic.Event
 - outsource scrollscene code
 - make tweens to be definable only in parameters (velocity-esque)
 - add error message, when plugin dependency isn't loaded (only for non-minified version)
 - Indicators plugin: end-indicator to above line and auto-suffix
 - Indicators plugin: optimize performance (huge drawbacks, when using many scenes)
 - make jQuery plugin version

 - bug: when cascading pins (pinning one element multiple times) and later removing them without reset, positioning errors occur.
 - bug: having multiple scroll directions with cascaded pins doesn't work (one scroll vertical, one horizontal)


# Build (gulpfile.js)
 - add error when lint fails.
 - custom reporter for jslint
 - make jsdoc generation properly
 - split generation of files, minified files and jsdocs in seperate tasks
 - exclude Scene Indicators from minification?
 - add tests to gulp routine
 - make travis-ci and dev gulp (dev gulp including source map)

# Project
 - texte durchgehen
 - rewrite tests to use require
 - test all variants (jquery, regular, minified)