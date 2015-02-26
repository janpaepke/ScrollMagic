# Source
 - feature: new plugin: mobile scrolling
 - feature: new plugin: AngularJS

# Build (gulpfile.js)
 - autoupdate npm on new git version

# Testing
 - cross browser test scrollPosition getter functions
 - add missing tests (core methods, _utils)

# Project
 - add missing private docs (global search TODO)

# Release guide
- copy current master to new branch "1.3"
- update release date in CHANGELOG.md
- build new version (update version number, generate docs)
- run test a couple of times
- commit
- push
- add git tag
- push tags
- edit tag on github -> Release
- merge dev to master
- change title on github to new tagline

- update gh-pages
- push stub files to gh-pages/js

- publish on npm

- bower unregister current name (camelCase) (first try to register lower case) http://bower.io/docs/creating-packages/#unregister
- bower clear cache
- bower register new name (slugstyle) http://bower.io/docs/creating-packages/#register

- update dist files in cdnjs
- run cdnjs test
- commit to fork of cdnjs and push
- send pull request to cdnjs

- share on twitter
- send mail

- update fiddle (contributing)