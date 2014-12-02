# Source

 - Plugin Indicators: remove jQuery dependency
 - Plugin Indicators: end-indicator to above line and auto-suffix
 - Plugin Indicators: optimize performance (huge drawbacks, when using many scenes)
 - Plugin Animation GSAP: create from Scene source
 - Plugin Animation GSAP: make it work with LITE versions as well
 - Plugin Animation GSAP: make tweens to be definable only in parameters (velocity-esque)
 - Plugin Animation Velocity: create, make tweens to be definable only in parameters
 - Plugin ALL: add error message, when plugin dependency isn't loaded (only for non-minified version)
 - go through inline TO-DOs.
 – check if event namespaces are working properly

 - bug: when cascading pins (pinning one element multiple times) and later removing them without reset, positioning errors occur.
 - bug: having multiple scroll directions with cascaded pins doesn't work (one scroll vertical, one horizontal)

# Build (gulpfile.js)
 - make jsdoc generation properly && repair docs
 - make tests task
 - make sourcemaps task
 – optimize minification

# Test
 - rewrite for should?
 - rewrite to use require
 - add tests for _utils
 - test all variants (regular, minified) and plugins

# Project
 - texte durchgehen
 - document gulpfile options and new dev structure (CONTRIBUTING.md)