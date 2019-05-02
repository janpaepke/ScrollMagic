# Source
 - change: make toogle class default behaviour: https://github.com/janpaepke/ScrollMagic/pull/421
 - update: update velocity - best wait for v2 release. https://github.com/julianshapiro/velocity/releases
 - feature: new plugin: mobile scrolling
 - change: swap bower for yarn/webpack?
 - bug: find better solution for chrome parallax workaround (dev/src/ScrollMagic.js:28)
 - fix: don't show pushFollowers warning if duration 0 and pushFollowers is not actively set.
 - feature: allow duration to be something like "100% + 20" to have a fixed value added to a relative one. 

# Build
 - fix docs template for anchor links
 - autoupdate npm on new git version (still needed?)

# Testing
 - add missing tests (core methods, _utils)

# Project
 - rework contributing.md
 - update CONTRIBUTING.md with a better instructon for PRs (what files to commit etc.)
 - update CONTRIBUTING.md with all gulp build options
 - replace bower example with webpack in readme.md
 - fix google analytics
 - add missing private docs (global search TODO)
 - fix example sourcecode display to show unmodified code (i.e. when SM adds classes it will be shown)


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
