# Source
 - feature: new plugin: mobile scrolling
 - feature: new plugin: AngularJS
 - bug: find better solution for chrome parrallax workaround (dev/src/ScrollMagic.js:28)

# Build
 - autoupdate npm on new git version

# Testing
 - add missing tests (core methods, _utils)

# Project
 - add missing private docs (global search TODO)

# Release Guide
- add release date and changes to CHANGELOG.md
- build new version `gulp -b -d` (update version number, generate docs)
- run test a couple of times `gulp test`
- commit
- push
- add git tag `git tag v2.0.x`
- push tags `git push origin --tags` [optional: edit tag on GitHub]

- update gh-pages
- push stub files to gh-pages/js

- periodically update fiddle to require correct version (CONTRIBUTING.md)
