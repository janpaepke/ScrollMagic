CHANGELOG
=========

## 2.0.5 (2015-04-29)

#### bugfixes:
 - a JS error occurred in IE9 [see here](https://github.com/janpaepke/ScrollMagic/issues/289)
 - cascading pins of absolutely positioned elements didn't work [see here](https://github.com/janpaepke/ScrollMagic/issues/291)
 - scene state wasn't correct at start position [see here](https://github.com/janpaepke/ScrollMagic/issues/299)
 - updatePinState was called before scrollOffset update [see here](https://github.com/janpaepke/ScrollMagic/pull/303)


## 2.0.3 (2015-04-07)

#### changes (non-breaking)
 - moved to new jQuery plugin definition via npm [see here](http://blog.npmjs.org/post/111475741445/publishing-your-jquery-plugin-to-npm-the-quick)
 - updated and improved several examples
 - optimized minification
 - changed command line options for build (version bumping)

#### bugfixes:
 - height calculation for pinned elements when using `pushFollowers: false` was faulty
 - parallax jitter fix for chrome
 - when using responsive duration and `pushFollowers = true`, an invalid console warning message was triggered
 - the sourcecode viewer in the examples code was showing modified code
 - fixed a problem when using the mousewheel to scroll over fixed elements after replacing the default scroll method of the controller
 - using pinned elements as `Controller.scrollTo()` targets didn't work properly
 - mousewheel over pinned elements inside of div scroll containers didn't work in IE

#### features
 - it's now possible to supply additional parameters to custom scrollTo functions [see here](http://scrollmagic.io/docs/ScrollMagic.Controller.html#scrollTo)

#### new examples:
 - basic: [Section Wipes (natural)](http://scrollmagic.io/examples/basic/section_wipes_natural.html)
 - advanced: [Section Wipes (manual)](http://scrollmagic.io/examples/advanced/section_wipes_manual.html)
 - advanced: [Section Slides (manual)](http://scrollmagic.io/examples/advanced/section_slides_manual.html)


## 2.0.2 (2015-03-23)

#### bugfixes:
 - Size calculations for pinned elements were off in certain conditions [see here](https://github.com/janpaepke/ScrollMagic/issues/252)
 - scrollDirection detection broke in 2.0.1 [see here](https://github.com/janpaepke/ScrollMagic/issues/271)


## 2.0.1 (2015-03-17)

#### features
 - better npm/browserify support [see here](https://github.com/janpaepke/ScrollMagic/pull/254)

#### bugfixes:
 - missing browser global when using jQuery plugin [see here](https://github.com/janpaepke/ScrollMagic/issues/268)
 - resolving jitters due to out-of-sync scroll positions [see here](https://github.com/janpaepke/ScrollMagic/issues/255)


## 2.0.0 (2015-02-26)

#### changes (non-breaking)
 - **removal of all dependencies (jQuery & GSAP) – _ScrollMagic is now stand-alone._**
 - new file structure:
   - main module: 'ScrollMagic.js'
   - all available plugins in folder '/plugins'
 - new scene event: [add](http://scrollmagic.io/docs/ScrollMagic.Scene.html#event:add) fires when scene is added to a controller
 - new scene event: [remove](http://scrollmagic.io/docs/ScrollMagic.Scene.html#event:remove) fires when scene is removed from a controller
 - option changes in `Scene.addIndicators()`:
   - indicators are now always on top (option `zindex` removed)
   - option `suffix` is renamed to `name`
 - several performance tweaks
 - lots more info and warning messages (in the uncompressed development version)

#### changes (potentially breaking):
 - ScrollMagic Controllers are now instantiated using `var controller = new ScrollMagic.Controller();`
 - ScrollMagic Scenes are now instantiated using `var scene = new ScrollMagic.Scene();`
 - renamed method `Scene.parent()` to `Scene.controller()`
 - **removed scene method `triggerOffset()`**  
   Method was marked deprecated since v1.1.0 and has now been replaced by `triggerPosition()`.
 - **removed `Scene.setPin()` option `pinClass`**  
   Was used to add a class to the pinned element. The same can now be achieved using `setClassToggle()`.

#### features:
 - **new plugin 'debug.addIndicators' (formerly 'jquery.scrollmagic.debug')**
   - indicators can now be added to the scene before it was added to a controller
   - indicators also work when scenes are removed and readded
   - indicator labels are autoindexed, when no explicit label is supplied
   - new controller option 'addIndicators', when a controller is initialized using `new ScrollMagic.Controller({addIndicators: true})` all added scenes will automatically have indicators added to them
   - start indicator is now above the line for less overlays (i.e. one scene starts, where another ends)
   - huge performance optimization, especially when using indicators for multiple scenes
   - new method `removeIndicators()`
 - **new plugin 'animation.gsap'**  
    - Contains all GSAP tween functionality formerly integrated into ScrollMagic (`setTween()` and `removeTween()`)
    - new feature for shorthand TweenMax.to() animation using `setTween(target, duration, parameters)` or `setTween(target, parameters)`
 - **new plugin 'animation.velocity'**  
   The velocity animation framework can now be used to trigger animations using `Scene.setVelocity(target, properties, options)`
   Note that for the time being velocity only works with 0 duration scenes, because timeline scrubbing isnt supported by velocity (yet).
 - **new plugin 'jquery.ScrollMagic'**  
   - adds support for jQuery selectors and makes all methods accept jQuery objects as element parameters.
   - moves ScrollMagic global to `$.ScrollMagic`. To instantiate a controller respectively call `new $.ScrollMagic.Controller()`.
 - **new option for responsive duration**
   The Scene duration can now be a percentage string like `"100%"`.  
   It will be calculated in relation to the size of the scroll container. It use the container's height for vertically scrolling applications and its width for horizontally scrolling containers.

#### bugfixes:
 - vertical Pins in DIV scroll containers did not work, when using a mousewheel while the cursor was over the pinned element
 - using `removeTween(true)` to remove and reset a Tween didn't work when the scene's duration was 0
 - when removing pins from cascaded pins using `removePin(true)` messed up the DOM structure (long term bug)
 - when pinning absolutely positioned elements using `bottom` or `right`, the positioning was off (See issue [226](https://github.com/janpaepke/ScrollMagic/issues/226))

#### project management:
 - changed build system to [gulp](http://gulpjs.com/) [see here](CONTRIBUTING.md#development-contribution)
 - moved all Module dist files to '/scrollmagic' [see here](scrollmagic)
 - published scrollmagic on npm as `scrollmagic`
 - renamed package on bower from `ScrollMagic` to `scrollmagic` to adhere to naming conventions


## 1.3.0 (2014-11-13)

#### changes (potentially breaking):
 - changed AMD loader behavior to export only one object -> `{Controller: ScrollMagic, Scene: ScrollScene}`

#### bugfixes:
 - added Error message for missing dependencies
 - fixed bubbling of pseudo-resize event of div containers
 - reference bug with AMD loading


## 1.2.0 (2014-10-14)

#### features
 - AMD loader support (See issue [160](https://github.com/janpaepke/ScrollMagic/issues/160))
 - added warning for tweens being overwritten (See issue [145](https://github.com/janpaepke/ScrollMagic/issues/145))

#### changes (non-breaking):
 - better code for mobile clicks (See issue [169](https://github.com/janpaepke/ScrollMagic/issues/169))
 - updated [draw example](http://scrollmagic.io/examples/advanced/svg_drawing.html) to camel case to support Firefox
 - updated [parralax sections example](http://scrollmagic.io/examples/advanced/parallax_sections.html) to moving divs instead of background position
 - added new references
 - added favicon

#### bugfixes:
 - scroll momentum increased in Firefox over fixed elements (See issue [164](https://github.com/janpaepke/ScrollMagic/issues/164))
 - parallax example was juggy in Firefox and Safari -> removed reliance of TweenMax ticker in favor of requestAnimationFrame (See issue [167](https://github.com/janpaepke/ScrollMagic/issues/167))
 - bugfix for pinned elements jittering if inside a container, because of the delayed position update in refreshInterval


## 1.1.0 (2014-09-04)

#### changes (potentially breaking):
 - **zero duration scene events & states**  
   The event logic for zero duration scenes has been changed: From now on a zero duration scene will trigger `enter`, `start`, `progress` (in this order) when scrolling forward past the trigger point and `progress`, `start`, `leave` when scrolling in reverse.  
   This means there will never be an `end` event triggered, which reflects the behaviour more accurately.  
   Furthemore this affects the scene's possible states, which can now only be `"BEFORE"` and `"DURING"` for zero duration scenes.  
   To learn more, read [this issue](https://github.com/janpaepke/ScrollMagic/issues/141#issuecomment-53549776) or [this documentation](http://scrollmagic.io/docs/ScrollMagic.Scene.html#progress).
 - **removed method `startPosition()`**  
   Method was marked deprecated since v1.0.7 and has now been replaced by `triggerPosition()`.  
   The terms "_offset_" and "_position_" were used too randomly.  
   To avoid confision, from now on "_offset_" will be used in connection with the scroll offset of the container, while "_position_" refers to the top / left values within the DOM.
 - **`change` event only fires when change actually happened**  
   If a setter is used with the current value or the internal validator fails and defaults to the same value an option is already set to, no `change` event will be fired anymore.

#### changes (non-breaking)
 - **scenes are sorted in controller**  
   Scenes attached to the same controller are now updated in the order of their start position.  
   This way DOM modifcations (e.g. tweens) that influence each other are sure to be called in the right order.  
   To learn more, read [this issue](https://github.com/janpaepke/ScrollMagic/issues/141).
 - **marked `triggerOffset` as deprecated, replaced by `triggerPosition`**  
   Renaming to avoid confusion. Read above for clarification.
 - **new controller option `refreshInterval`**  
   To update values that otherwise wouldn't fire an event a `refreshInterval` option was added to poll for changes.  
   These changes involve resizing of a div scroll container or movement of a scene's trigger element position.  
 - **no more logging in minified version**  
   All debug logging functionality was removed when using the minified version to save on filesize.

#### features:
 - new controller method: [scrollTo](http://scrollmagic.io/docs/ScrollMagic.Controller.html#scrollTo)
 - new controller method: [scrollPos](http://scrollmagic.io/docs/ScrollMagic.Controller.html#scrollPos)
 - new scene method: [refresh](http://scrollmagic.io/docs/ScrollMagic.Scene.html#refresh)
 - new scene method: [setClassToggle](http://scrollmagic.io/docs/ScrollMagic.Scene.html#setClassToggle), [removeClassToggle](http://scrollmagic.io/docs/ScrollMagic.Scene.html#removeClassToggle) respectively
 - new scene event: [shift](http://scrollmagic.io/docs/ScrollMagic.Scene.html#event:shift) fires when scene position changes
 - new scene event: [destroy](http://scrollmagic.io/docs/ScrollMagic.Scene.html#event:destroy) fires when scene is destroyed
 - extended scene option [duration](http://scrollmagic.io/docs/ScrollMagic.Scene.html#duration) to support dynamic updates in responsive layouts
 - docs: grouped methods for more clear arrangement
 - docs: various additions and clarifications

#### bugfixes:
 - removing and resetting pins during pin phase didn't work properly
 - using mousewheel to scroll over pinned elements in container (See issues [34](https://github.com/janpaepke/ScrollMagic/issues/34), [50](https://github.com/janpaepke/ScrollMagic/issues/50), [82](https://github.com/janpaepke/ScrollMagic/issues/82), [139](https://github.com/janpaepke/ScrollMagic/issues/139), [140](https://github.com/janpaepke/ScrollMagic/issues/140))
 - pin width collapsed, if no width was defined (See issues [63](https://github.com/janpaepke/ScrollMagic/issues/63), [94](https://github.com/janpaepke/ScrollMagic/issues/94))
 - positioned pins didn't work in IE 9
 - padding of pinned elements was added to relative width
 - event namespace issues
 - docs: fixed highlight & deeplink issues

#### new examples:
 - basic: [CSS Class Toggles](http://scrollmagic.io/examples/basic/class_toggles.html)
 - advanced: [SVG Line Drawing](http://scrollmagic.io/examples/advanced/svg_drawing.html)
 - advanced: [Parallax Sections](http://scrollmagic.io/examples/advanced/parallax_sections.html)
 - expert: [Image Sequences](http://scrollmagic.io/examples/expert/image_sequence.html)
 - expert: [Bezier Path Animations](http://scrollmagic.io/examples/expert/bezier_path_animation.html)
