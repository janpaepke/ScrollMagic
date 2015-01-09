# Source
 - Plugin Animation GSAP: test if lite and regular versions really both work
 - Plugin Animation GSAP: make tweens to be definable only in parameters (velocity-esque)
 - add missing docs (global search TODO)
 
 - bug: when cascading pins (pinning one element multiple times) and later removing them without reset, positioning errors occur.
 - bug: having multiple scroll directions with cascaded pins doesn't work (one scroll vertical, one horizontal)

# Build (gulpfile.js)
 - make jsdoc generation properly & repair docs
 - make sourcemaps task
 – optimize minification

# Test
 - cross browser test scrollPosition getter functions
 - add tests for _utils
 - test all variants (regular, minified) and plugins

# Project
 - texte durchgehen
 - document gulpfile options and new dev structure (CONTRIBUTING.md)