# Source
 - outsource scrollscene code
 - make utils externally available

 - Plugin jQuery: make use of jQuery functions for _utils.
 - Plugin Indicators: remove jQuery dependency
 - Plugin Indicators: end-indicator to above line and auto-suffix
 - Plugin Indicators: optimize performance (huge drawbacks, when using many scenes)
 - Plugin Animation GSAP: create from Scene source
 - Plugin Animation GSAP: make it work with LITE versions as well
 - Plugin Animation GSAP: make tweens to be definable only in parameters (velocity-esque)
 - Plugin Animation Velocity: create, make tweens to be definable only in parameters
 - Plugin ALL: add error message, when plugin dependency isn't loaded (only for non-minified version)

 - bug: when cascading pins (pinning one element multiple times) and later removing them without reset, positioning errors occur.
 - bug: having multiple scroll directions with cascaded pins doesn't work (one scroll vertical, one horizontal)

# Build (gulpfile.js)
 - beautify
 - add error when lint fails.
 - custom reporter for jslint
 - make jsdoc generation properly && repair docs
 - add tests to gulp routine
 - make travis-ci and dev gulp (dev gulp including source map)
 - make sourcemap for development phase ?
 - update gulp-file-include once rel paths are implemented

# Test
 - add tests for _utils
 - rewrite to use require
 - test all variants (jquery, regular, minified)

# Project
 - texte durchgehen
 - document gulpfile options and new dev structure (CONTRIBUTING.md)