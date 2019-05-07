# Source
 - change: make toogle class default behaviour: https://github.com/janpaepke/ScrollMagic/pull/421
  - update Reveal on Scroll example to work with above bevhaviour (maybe remove a class instead of adding)
 - update: update velocity - best wait for v2 release. https://github.com/julianshapiro/velocity/releases
 - bug: find better solution for chrome parallax workaround (dev/src/ScrollMagic.js:28)
 - feature: allow duration to be something like "100% + 20" to have a fixed value added to a relative one. 
 - feature: new plugin: mobile scrolling

# Build
 - fix docs template for anchor links
 - autoupdate npm (publish) on new git version (still needed?)

# Testing
 - add missing tests (core methods, _utils)

# Project
 - add missing private docs (global search TODO)
 - fix example sourcecode display to show unmodified code (i.e. when SM adds classes it will be shown)
 - replace bower with yarn/webpack? concerns examples in readme.md, website and potentially sourcecode


# Release Guide
- add release date and changes to CHANGELOG.md
- build new version `gulp -b -d` (update version number, generate docs)
- run test a couple of times `gulp test`
- commit
- push
- add git tag `git tag v2.0.x`
- push tags `git push origin --tags` [optional: edit tag on GitHub]

- update gh-pages `git push -f origin master:gh-pages`
- push stub files to gh-pages/js

- periodically update fiddle to require correct version (CONTRIBUTING.md)
