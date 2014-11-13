CHANGELOG
=========

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
 - updated [draw example](http://janpaepke.github.io/ScrollMagic/examples/advanced/svg_drawing.html) to camel case to support Firefox
 - updated [parralax sections example](http://janpaepke.github.io/ScrollMagic/examples/advanced/parallax_sections.html) to moving divs instead of background position
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
   To learn more, read [this issue](https://github.com/janpaepke/ScrollMagic/issues/141#issuecomment-53549776) or [this documentation](http://janpaepke.github.io/ScrollMagic/docs/ScrollScene.html#progress).
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
 - new controller method: [scrollTo](http://janpaepke.github.io/ScrollMagic/docs/ScrollMagic.html#scrollTo)
 - new controller method: [scrollPos](http://janpaepke.github.io/ScrollMagic/docs/ScrollMagic.html#scrollPos)
 - new scene method: [refresh](http://janpaepke.github.io/ScrollMagic/docs/ScrollScene.html#refresh)
 - new scene method: [setClassToggle](http://janpaepke.github.io/ScrollMagic/docs/ScrollScene.html#setClassToggle), [removeClassToggle](http://janpaepke.github.io/ScrollMagic/docs/ScrollScene.html#removeClassToggle) respectively
 - new scene event: [shift](http://janpaepke.github.io/ScrollMagic/docs/ScrollScene.html#event:shift) fires when scene position changes
 - new scene event: [destroy](http://janpaepke.github.io/ScrollMagic/docs/ScrollScene.html#event:destroy) fires when scene is destroyed
 - extended scene option [duration](http://janpaepke.github.io/ScrollMagic/docs/ScrollScene.html#duration) to support dynamic updates in responsive layouts
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

#### examples:
 - basic: [CSS Class Toggles](http://janpaepke.github.io/ScrollMagic/examples/basic/class_toggles.html)
 - advanced: [SVG Line Drawing](http://janpaepke.github.io/ScrollMagic/examples/advanced/svg_drawing.html)
 - advanced: [Parallax Sections](http://janpaepke.github.io/ScrollMagic/examples/advanced/parallax_sections.html)
 - expert: [Image Sequences](http://janpaepke.github.io/ScrollMagic/examples/expert/image_sequence.html)
 - expert: [Bezier Path Animations](http://janpaepke.github.io/ScrollMagic/examples/expert/bezier_path_animation.html)
