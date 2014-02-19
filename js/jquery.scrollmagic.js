/*
	@overview
	ScrollMagic - The jQuery plugin for doing magical scroll animations
	by Jan Paepke 2014 (@janpaepke)

	Inspired by and partially based on SUPERSCROLLORAMA by John Polacek (@johnpolacek)
	johnpolacek.github.com/superscrollorama/

	Powered by the Greensock Tweening Platform
	http://www.greensock.com/js
	Greensock License info at http://www.greensock.com/licensing/

	@version - 1.0.0
	@requires - jQuery
	@license - Dual licensed under MIT and GPL.
	@author - Jan Paepke, e-mail@janpaepke.de
*/

// @todo: make readme
// @todo: make project homepage
// -----------------------
// @todo: improvement: consider call conditions for updatePinSpacerSize (performance?)
// @todo: improvement: only update fixed position when it changed (otherwise some quirks in safari - also: performance...)
// @todo: bug: when cascading pins (pinning one element multiple times) and later removing them without reset positioning errors occur.
// @todo: bug: having multiple scroll directions with cascaded pins doesn't work (one scroll vertical, one horizontal)
// @todo: feature: have different tweens, when scrolling up, than when scrolling down
// @todo: feature: make pins work with -webkit-transform of parent for mobile applications. Might be possible by temporarily removing the pin element from its container and attaching it to the body during pin. Reverting might be difficult though (cascaded pins).

(function($) {
	/**
	 * The main class that is needed once per scroll container.
	 *
	 * @constructor
	 *
	 * @example
	 * // basic initialization
	 * var controller = new ScrollMagic();
	 *
	 * // passing options
	 * var controller = new ScrollMagic({container: "#myContainer", loglevel: 3});
	 *
	 * @param {object} [options] - An object containing one or more options for the controller.
	 * @param {(string|object)} [options.container=window] - A selector, DOM Object or a jQuery object that references the main container for scrolling.
	 * @param {boolean} [options.vertical=true] - Sets the scroll mode to vertical (`true`) or horizontal (`false`) scrolling.
	 * @param {object} [options.globalSceneOptions={}] - These options will be passed to every Scene that is added to the controller using the addScene method. For more information on Scene options see {@link ScrollScene}.
	 * @param {number} [options.loglevel=2] Loglevel for debugging:
											 ** `0` => silent
											 ** `1` => errors
											 ** `2` => errors, warnings
											 ** `3` => errors, warnings, debuginfo
	 *
	 */
	ScrollMagic = function(options) {

		/*
		 * ----------------------------------------------------------------
		 * settings
		 * ----------------------------------------------------------------
		 */
		var
			DEFAULT_OPTIONS = {
				container: window,
				vertical: true,
				globalSceneOptions: {},
				loglevel: 2
			};

		/*
		 * ----------------------------------------------------------------
		 * private vars
		 * ----------------------------------------------------------------
		 */

		var
			ScrollMagic = this,
			_options = $.extend({}, DEFAULT_OPTIONS, options),
			_sceneObjects = [],
			_updateScenesOnNextTick = false,		// can be boolean (true => all scenes) or an array of scenes to be updated
			_scrollPos = 0,
			_scrollDirection = "PAUSED",
			_isDocument = true,
			_viewPortSize = 0,
			_tickerUsed = false;

		/*
		 * ----------------------------------------------------------------
		 * private functions
		 * ----------------------------------------------------------------
		 */

		/**
		 * Internal constructor function of ScrollMagic
		 * @private
		 */
		var construct = function () {
			_options.container = $(_options.container).first()
			// check ScrolContainer
			if (_options.container.length == 0) {
				log(1, "ERROR creating object ScrollMagic: No valid scroll container supplied");
				return; // cancel
			}
			_isDocument = !$.contains(document, _options.container.get(0));
			// update container size immediately
			_viewPortSize = _options.vertical ? _options.container.height() : _options.container.width();
			// set event handlers
			_options.container.on("scroll resize", onChange);
			try {
				TweenLite.ticker.addEventListener("tick", onTick); // prefer TweenMax Ticker, but don't rely on it for basic functionality
				_tickerUsed = true;
			} catch (e) {
				_options.container.on("scroll resize", onTick); // okay then just update on scroll/resize...
				_tickerUsed = false;
			}

			log(3, "added new ScrollMagic controller");
		};

		/**
		* Handle updates on tick instad of on scroll (performance)
		* @private
		*/
		var onTick = function (e) {
			if (_updateScenesOnNextTick) {
				var scenesToUpdate = $.isArray(_updateScenesOnNextTick) ? _updateScenesOnNextTick : _sceneObjects;
				$.each(scenesToUpdate, function (index, scene) {
					log(3, "updating Scene " + (index + 1) + "/" + scenesToUpdate.length + " (" + _sceneObjects.length + " total)");
					scene.update(true);
				});
				if (scenesToUpdate.length == 0 && _options.loglevel >= 3) {
					log(3, "updating 0 Scenes (nothing added to controller)");
				}
				_updateScenesOnNextTick = false;
			}
		};
		
		/**
		* Handles Container changes
		* @private
		*/
		var onChange = function (e) {
			if (e.type == "resize") {
				_viewPortSize = _options.vertical ? _options.container.height() : _options.container.width();
			}
			var oldScrollPos = _scrollPos;
			_scrollPos = _options.vertical ? _options.container.scrollTop() : _options.container.scrollLeft();
			var deltaScroll = _scrollPos - oldScrollPos;
			_scrollDirection = (deltaScroll == 0) ? "PAUSED" : (deltaScroll > 0) ? "FORWARD" : "REVERSE";
			_updateScenesOnNextTick = true;
		};

		/**
		 * Send a debug message to the console.
		 * @private
		 *
		 * @param {number} loglevel - The loglevel required to initiate output for the message.
		 * @param {...mixed} output - One or more variables that should be passed to the console.
		 */
		var log = function (loglevel, output) {
			if (_options.loglevel >= loglevel) {
				var
					prefix = "(ScrollMagic) ->",
					args = Array.prototype.splice.call(arguments, 1),
					func = Function.prototype.bind.call(debug, window);
				args.unshift(loglevel, prefix);
				func.apply(window, args);
			}
		};

		/*
		 * ----------------------------------------------------------------
		 * public functions
		 * ----------------------------------------------------------------
		 */

		/**
		 * Add a Scene to the controller.<br>
		 * This is the equivalent to {@link ScrollScene}.addTo(controller)
		 * @public
		 * @example
		 * // with a previously defined scene
		 * controller.addScene(scene);
		 *
	 	 * // with a newly created scene.
		 * controller.addScene(new ScrollScene({duration : 0}));
		 *
		 * @param {ScrollScene} scene - The ScollScene to be added.
		 * @return {ScrollMagic} Parent object for chaining.
		 */
		this.addScene = function (ScrollScene) {
			if (ScrollScene.parent() != ScrollMagic) {
				ScrollScene.addTo(ScrollMagic);
			} else if ($.inArray(_sceneObjects, ScrollScene) == -1){
				// new scene
				_sceneObjects.push(ScrollScene);
				// insert Global defaults.
				$.each(_options.globalSceneOptions, function (key, value) {
					if (ScrollScene[key]) {
						ScrollScene[key].call(ScrollScene, value);
					}
				})
				log(3, "added Scene (" + _sceneObjects.length + " total)");
			}
			return ScrollMagic;
		};

		/**
		 * Remove a scene from the controller.<br>
		 * This is the equivalent to {@link ScrollScene}.remove()
		 * @public
		 * @example
		 * // remove a scene from the controller
		 * controller.removeScene(scene);
		 *
		 * @param {ScrollScene} scene - The ScollScene to be removed.
		 * @returns {ScrollMagic} Parent object for chaining.
		 */
		this.removeScene = function (ScrollScene) {
			var index = $.inArray(ScrollScene, _sceneObjects);
			if (index > -1) {
				_sceneObjects.splice(index, 1);
				ScrollScene.remove();
				log(3, "removed Scene (" + _sceneObjects.length + " total)");
			}
			return ScrollMagic;
		};

		/**
		 * Update a specific scene according to the scroll position of the container.<br>
		 * This is the equivalent to {@link ScrollScene}.update()
		 * @public
		 * @example
		 * // update a specific scene on next tick
	 	 * controller.updateScene(scene);
	 	 *
		 * // update a specific scene immediately
		 * controller.updateScene(scene, true);
		 *
		 * @param {ScrollScene} scene - The ScollScene object that is supposed to be updated.
		 * @param {boolean} [immediately=false] - If `true` the update will be instantly, if `false` it will wait until next tweenmax tick.<br>
		 										  This is useful when changing multiple properties of the scene - this way it will only be updated once all new properties are set (onTick).
		 * @return {ScrollMagic} Parent object for chaining.
		 */
		this.updateScene = function (scene, immediately) {
			if (immediately) {
				scene.update(true);
			} else {
				if (!$.isArray(_updateScenesOnNextTick)) {
					_updateScenesOnNextTick = [];
				}
				if ($.inArray(scene, _updateScenesOnNextTick) == -1) {
					_updateScenesOnNextTick.push(scene);	
				}
			}
			return ScrollMagic;
		};

		/**
		 * Update the controller params and all its Scenes.
		 * @public
		 * @example
		 * // update the controller on next tick (saves performance)
		 * controller.update();
		 *
	 	 * // update the controller immediately
		 * controller.update(true);
		 *
		 * @param {boolean} [immediately=false] - If `true` the update will be instantly, if `false` it will wait until next tweenmax tick (better performance)
		 * @return {ScrollMagic} Parent object for chaining.
		 */
		this.update = function (immediately) {
			onChange({type: "resize"}); // will set _updateScenesOnNextTick to true
			if (immediately) {
				onTick();
			}
			return ScrollMagic;
		};

		/**
		 * **Get** all infos or one in particular about the controller.
		 * @public
		 * @example
		 * // returns the current scroll position (number)
		 * var scrollPos = controller.info("scrollPos");
		 *
		 * // returns all infos as an object
		 * var infos = controller.info();
		 *
		 * @param {string} [about] - If passed only this info will be returned instead of an object containing all.<br>
		 							 Valid options are:
		 							 ** `"size"` => the current viewport size of the container
		 							 ** `"vertical"` => true if vertical scrolling, otherwise false
		 							 ** `"scrollPos"` => the current scroll position
		 							 ** `"scrollDirection"` => the last known direction of the scroll
		 							 ** `"container"` => the container element
		 							 ** `"isDocument"` => true if container element is the document.
		 * @returns {(mixed|object)} The requested info(s).
		 */
		this.info = function (about) {
			var values = {
				size: _viewPortSize, // contains height or width (in regard to orientation);
				vertical: _options.vertical,
				scrollPos: _scrollPos,
				scrollDirection: _scrollDirection,
				container: _options.container,
				isDocument: _isDocument
			}
			if (!arguments.length) { // get all as an object
				return values;
			} else if (values[about] !== undefined) {
				return values[about];
			} else {
				log(1, "ERROR: option \"" + about + "\" is not available");
				return;
			}
		};

		/**
		 * **Get** or **Set** the current loglevel option value.
		 * @public
		 *
		 * @example
		 * // get the current value
		 * var loglevel = controller.loglevel();
		 *
	 	 * // set a new value
		 * controller.loglevel(3);
		 *
		 * @param {number} [newLoglevel] - The new loglevel setting of the ScrollMagic controller. `[0-3]`
		 * @returns {(number|ScrollMagic)} Current loglevel or parent object for chaining.
		 */
		this.loglevel = function (newLoglevel) {
			if (!arguments.length) { // get
				return _options.loglevel;
			} else if (_options.loglevel != newLoglevel) { // set
				_options.loglevel = newLoglevel;
			}
			return ScrollMagic;
		};

		
		/**
		 * Destroy the Controller, all Scenes and everything.
		 * @public
		 *
		 * @example
		 * // without resetting the scenes
		 * controller = controller.destroy();
		 *
	 	 * // with scene reset
		 * controller = controller.destroy(true);
		 *
		 * @param {boolean} [resetScenes=false] - If `true` the pins and tweens (if existent) of all scenes will be reset.
		 * @returns {null} Null to unset handler variables.
		 */
		this.destroy = function (resetScenes) {
			while (_sceneObjects.length > 0) {
				var scene = _sceneObjects[_sceneObjects.length - 1];
				scene.destroy(resetScenes);
			}
			_options.container.off("scroll resize", onChange);
			if (_tickerUsed) {
				TweenLite.ticker.removeEventListener("tick", onTick);
			} else {
				_options.container.off("scroll resize", onTick);
			}
			log(3, "destroyed ScrollMagic (reset: " + (resetScenes ? "true" : "false") + ")");
			return null;
		};

		// INIT
		construct();
		return ScrollMagic;
	};


	/**
	 * A ScrollScene defines where the controller should react and how.
	 *
	 * @constructor
	 *
	 * @example
	 * // create a standard scene and add it to a controller
	 * new ScrollScene()
	 *		.addTo(controller);
	 *
	 * // create a scene with custom options and assign a handler to it.
	 * var scene = new ScrollScene({
	 * 		duration: 100,
	 *		offset: 200,
	 *		triggerHook: "onEnter",
	 *		reverse: false
	 * });
	 *
	 * @param {object} [options] - Options for the Scene. (Can be changed later on)
	 * @param {number} [options.duration=0] - The duration of the scene.<br>
	 										  If `0` tweens will auto-play when reaching the scene start point, pins will be pinned indefinetly starting at the start position.
	 * @param {number} [options.offset=0] - Offset Value for the Trigger Position. If no triggerElement is defined this will be the scroll distance from the start of the page, after which the scene will start.
	 * @param {(string|object)} [options.triggerElement=null] - Selector, DOM Object or jQuery Object that defines the start of the scene. If undefined the scene will start right at the start of the page (unless an offset is set).
	 * @param {(number|string)} [options.triggerHook="onCenter"] - Can be a number between 0 and 1 defining the position of the trigger Hook in relation to the viewport.<br>
	 															  Can also be defined using a string:
	 															  ** `"onEnter"` => `1`
	 															  ** `"onCenter"` => `0.5`
	 															  ** `"onLeave"` => `0`
	 * @param {boolean} [options.reverse=true] - Should the scene reverse, when scrolling up?
	 * @param {boolean} [options.tweenChanges=false] - Tweens Animation to the progress target instead of setting it.<br>
	 												   Does not affect animations where duration is `0`.
	 * @param {number} [options.loglevel=2] - Loglevel for debugging.
	 										  ** `0` => silent
	 										  ** `1` => errors
	 										  ** `2` => errors, warnings
	 										  ** `3` => errors, warnings, debuginfo
	 * 
	 */
	ScrollScene = function (options) {

		/*
		 * ----------------------------------------------------------------
		 * settings
		 * ----------------------------------------------------------------
		 */

		var
			TRIGGER_HOOK_STRINGS = ["onCenter", "onEnter", "onLeave"],
			EVENT_NAMESPACE = "ScrollScene",
			DEFAULT_OPTIONS = {
				duration: 0,
				offset: 0,
				triggerElement: null,
				triggerHook: TRIGGER_HOOK_STRINGS[0],
				reverse: true,
				tweenChanges: false,
				loglevel: 2
			};

		/*
		 * ----------------------------------------------------------------
		 * private vars
		 * ----------------------------------------------------------------
		 */

		var
			ScrollScene = this,
			_options = $.extend({}, DEFAULT_OPTIONS, options),
			_state = 'BEFORE',
			_progress = 0,
			_parent,
			_tween,
			_pin,
			_pinOptions;


		/*
		 * ----------------------------------------------------------------
		 * private functions
		 * ----------------------------------------------------------------
		 */

		/**
		 * Internal constructor function of ScrollMagic
		 * @private
		 */
		var construct = function () {
			checkOptionsValidity();

			// internal event listeners
			ScrollScene.on("change.internal", function (e) {
				checkOptionsValidity();
				if (e.what != "loglevel") { // no need to update the scene with this option...
					if (e.what == "duration") { //  || _options.duration == 0 && _state === "AFTER"
						updatePinState();
					}
					ScrollScene.update();
				}
			});
			// internal event listeners
			ScrollScene.on("progress.internal", function (e) {
				updateTweenProgress();
				updatePinState();
			});
		};

		/**
		 * Send a debug message to the console.
		 * @private
		 *
		 * @param {number} loglevel - The loglevel required to initiate output for the message.
		 * @param {...mixed} output - One or more variables that should be passed to the console.
		 */
		var log = function (loglevel, output) {
			if (_options.loglevel >= loglevel) {
				var
					prefix = "(ScrollScene) ->",
					args = Array.prototype.splice.call(arguments, 1),
					func = Function.prototype.bind.call(debug, window);
				args.unshift(loglevel, prefix);
				func.apply(window, args);
			}
		}

		/**
		 * Check the validity of all options and reset to default if neccessary.
		 * @private
		 */
		var checkOptionsValidity = function () {
			_options.duration = parseFloat(_options.duration);
			if (!$.isNumeric(_options.duration) || _options.duration < 0) {
				log(1, "ERROR: Invalid value for ScrollScene option \"duration\":", _options.duration);
				_options.duration = DEFAULT_OPTIONS.duration;
			}
			_options.offset = parseFloat(_options.offset);
			if (!$.isNumeric(_options.offset)) {
				log(1, "ERROR: Invalid value for ScrollScene option \"offset\":", _options.offset);
				_options.offset = DEFAULT_OPTIONS.offset;
			}
			if (_options.triggerElement != null && $(_options.triggerElement).length == 0) {
				log(1, "ERROR: Element defined in ScrollScene option \"triggerElement\" was not found:", _options.triggerElement);
				_options.triggerElement = DEFAULT_OPTIONS.triggerElement;
			}
			if (!$.isNumeric(_options.triggerHook) && $.inArray(_options.triggerHook, TRIGGER_HOOK_STRINGS) == -1) {
				log(1, "ERROR: Invalid value for ScrollScene option \"triggerHook\": ", _options.triggerHook);
				_options.triggerHook = DEFAULT_OPTIONS.triggerHook;
			}
			if (!$.isNumeric(_options.loglevel) || _options.loglevel < 0 || _options.loglevel > 3) {
				var wrongval = _options.loglevel;
				_options.loglevel = DEFAULT_OPTIONS.loglevel;
				log(1, "ERROR: Invalid value for ScrollScene option \"loglevel\":", wrongval);
			}
			if (_tween && _parent  && _options.triggerElement && _options.loglevel >= 2) {// parent is needed to know scroll direction.
				// check if there are position tweens defined for the trigger and warn about it :)
				var
					triggerTweens = _tween.getTweensOf($(_options.triggerElement)),
					vertical = _parent.info("vertical");
				$.each(triggerTweens, function (index, value) {
					var
						tweenvars = value.vars.css || value.vars,
						condition = vertical ? (tweenvars.top !== undefined || tweenvars.bottom !== undefined) : (tweenvars.left !== undefined || tweenvars.right !== undefined);
					if (condition) {
						log(2, "WARNING: Tweening the position of the trigger element affects the scene timing and should be avoided!");
						return false;
					}
				});
			}
		};

		/**
		 * Update the tween progress.
		 * @private
		 *
		 * @param {number} [to] - If not set the scene Progress will be used. (most cases)
		 * @return {boolean} true if the Tween was updated. 
		 */
		var updateTweenProgress = function (to) {
			var progress = (to >= 0 && to <= 1) ? to : _progress;
			if (_tween) {
				if (_tween.repeat() === -1) {
					// infinite loop, so not in relation to progress
					if ((_state === "DURING" || (_state === "AFTER" && _options.duration == 0)) && _tween.paused()) {
						_tween.play();
					} else if (_state !== "DURING" && !_tween.paused()) {
						_tween.pause();
					} else {
						return false;
					}
				} else if (progress != _tween.progress()) { // do we even need to update the progress?
					// no infinite loop - so should we just play or go to a specific point in time?
					if (_options.duration == 0) {
						// play the animation
						if (_state == "AFTER") { // play from 0 to 1
							_tween.play();
						} else { // play from 1 to 0
							_tween.reverse();
						}
					} else {
						// go to a specific point in time
						if (_options.tweenChanges) {
							// go smooth
							_tween.tweenTo(progress * _tween.duration());
						} else {
							// just hard set it
							_tween.progress(progress).pause();
						}
					}
				} else {
					return false;
				}
				return true;
			} else {
				return false;
			}
		};

		/**
		 * Update the pin state.
		 * @private
		 */
		var updatePinState = function (to) {
			var state = ($.inArray(to, ["BEFORE", "DURING", "AFTER"]) > -1) ? to : _state;
			if (_pin && _parent) {
				var 
					newCSS,
					containerInfo = _parent.info();

				if (state === "DURING" || (state === "AFTER" && _options.duration == 0)) { // if duration is 0 - we just never unpin
					// pinned
					var fixedPos = getOffset(_pinOptions.spacer, true); // get viewport position of spacer
 					
 					// add progress
 					fixedPos[containerInfo.vertical ? "top" : "left"] += _options.duration * _progress;

					newCSS = {
						position: "fixed",
						top: fixedPos.top,
						left: fixedPos.left
					};
				} else {
					// unpinned
					newCSS = {
						position: "relative",
						top:  0,
						left: 0
					};
					if (!_pinOptions.pushFollowers && state === "AFTER") {
						newCSS[containerInfo.vertical ? "top" : "left"] = _options.duration * _progress;
					}
				}
				// set new values
				_pin.css(newCSS);
				// update pin spacer in case the pin element's size is changed during pin.
				updatePinSpacerSize();
			}
		};

		/**
		 * Update the pin spacer size.
		 * The size of the spacer needs to be updated whenever the duration of the scene changes, if it is to push down following elements.
		 * @private
		 */
		var updatePinSpacerSize = function () {
			if (_pin && _parent) {
				var
					ended = (_state === "AFTER")
					vertical = _parent.info("vertical"),
					css = {};

				css[vertical ? "width" : "min-width"] = _pin.outerWidth(true);
				css[vertical ? "min-height" : "height"] = _pin.outerHeight(true);

				// special case margin left and right auto used to center horizontally in vertical scrolls
				if (vertical && _pinOptions.marginCenter) {
					css["margin-left"] = css["margin-right"] = "auto";
				}

				if (_pinOptions.pushFollowers) {
					if (vertical) {
						css.paddingTop = ended ? _options.duration : 0;
						css.paddingBottom = ended ? 0 : _options.duration;
					} else {
						css.paddingLeft = ended ? _options.duration : 0;
						css.paddingRight = ended ? 0 : _options.duration;
					}
				}
				_pinOptions.spacer.css(css);
			}
		};

		/**
		 * Updates the Pin state (in certain scenarios)
		 * If the controller container is not the document and we are mid-pin-phase scrolling or resizing the main document can result to wrong pin positions.
		 * So this function is called on resize and scroll of the document.
		 * @private
		 */
		var updatePinInContainer = function () {
			if (_parent && _pin && _state === "DURING") {
				if (!_parent.info("isDocument")) {
					updatePinState();
				}
			}
		};

		/*
		 * ----------------------------------------------------------------
		 * public functions (getters/setters)
		 * ----------------------------------------------------------------
		 */

		/**
		 * **Get** the parent controller.
		 * @public
		 * @example
		 * // get the parent controller of a scene
		 * var controller = scene.parent();
		 *
		 * @returns {ScrollMagic} Parent controller or `undefined`
		 */
		this.parent = function () {
			return _parent;
		};


		/**
		 * **Get** or **Set** the duration option value.
		 * @public
		 * @example
		 * // get the current duration value
		 * var duration = scene.duration();
		 *
	 	 * // set a new duration
		 * scene.duration(300);
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @param {number} [newDuration] - The new duration of the scene.
		 * @returns {number} `get` -  Current scene duration.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.duration = function (newDuration) {
			if (!arguments.length) { // get
				return _options.duration;
			} else if (_options.duration != newDuration) { // set
				_options.duration = newDuration;
				ScrollScene.trigger("change", {what: "duration", newval: newDuration}); // fire event
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the offset option value.
		 * @public
		 * @example
		 * // get the current offset
		 * var offset = scene.offset();
		 *
	 	 * // set a new offset
		 * scene.offset(100);
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @param {number} [newOffset] - The new offset of the scene.
		 * @returns {number} `get` -  Current scene offset.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.offset = function (newOffset) {
			if (!arguments.length) { // get
				return _options.offset;
			} else if (_options.offset != newOffset) { // set
				_options.offset = newOffset;
				ScrollScene.trigger("change", {what: "offset", newval: newOffset}); // fire event
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the triggerElement option value.
		 * @public
		 * @example
		 * // get the current triggerElement
		 * var triggerElement = scene.triggerElement();
		 *
	 	 * // set a new triggerElement using a selector
		 * scene.triggerElement("#trigger");
	 	 * // set a new triggerElement using a jQuery Object
		 * scene.triggerElement($("#trigger"));
	 	 * // set a new triggerElement using a DOM Object
		 * scene.triggerElement(document.getElementById("trigger"));
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @param {(string|object)} [newTriggerElement] - The new trigger element for the scene.
		 * @returns {(string|object)} `get` -  Current triggerElement.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.triggerElement = function (newTriggerElement) {
			if (!arguments.length) { // get
				return _options.triggerElement;
			} else if (_options.triggerElement != newTriggerElement) { // set
				_options.triggerElement = newTriggerElement;
				ScrollScene.trigger("change", {what: "triggerElement", newval: newTriggerElement}); // fire event
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the triggerHook option value.
		 * @public
		 * @example
		 * // get the current triggerHook value
		 * var triggerHook = scene.triggerHook();
		 *
	 	 * // set a new triggerHook using a string
		 * scene.triggerHook("onLeave");
	 	 * // set a new triggerHook using a number
		 * scene.triggerHook(0.7);
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @param {(number|string)} [newTriggerHook] - The new triggerHook of the scene. @see {@link ScrollScene) parameter description for value options.
		 * @returns {number} `get` -  Current triggerHook (ALWAYS numerical).
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.triggerHook = function (newTriggerHook) {
			if (!arguments.length) { // get
				var triggerPoint;
				if ($.isNumeric(_options.triggerHook)) {
					triggerPoint = _options.triggerHook;
				} else {
					switch(_options.triggerHook) {
						case "onCenter":
							triggerPoint = 0.5;
							break;
						case "onLeave":
							triggerPoint = 0;
							break;
						case "onEnter":
						default:
							triggerPoint = 1;
							break;
					}
				}
				return triggerPoint;
			} else if (_options.triggerHook != newTriggerHook) { // set
				_options.triggerHook = newTriggerHook;
				ScrollScene.trigger("change", {what: "triggerHook", newval: newTriggerHook}); // fire event
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the reverse option value.
		 * @public
		 * @example
		 * // get the current reverse option
		 * var reverse = scene.reverse();
		 *
	 	 * // set new reverse option
		 * scene.reverse(false);
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @param {boolean} [newReverse] - The new reverse setting of the scene.
		 * @returns {boolean} `get` -  Current reverse option value.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.reverse = function (newReverse) {
			if (!arguments.length) { // get
				return _options.reverse;
			} else if (_options.reverse != newReverse) { // set
				_options.reverse = newReverse;
				ScrollScene.trigger("change", {what: "reverse", newval: newReverse}); // fire event
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the tweenChanges option value.
		 * @public
		 * @example
		 * // get the current tweenChanges option
		 * var tweenChanges = scene.tweenChanges();
		 *
	 	 * // set new tweenChanges option
		 * scene.tweenChanges(true);
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @param {boolean} [newTweenChanges] - The new tweenChanges setting of the scene.
		 * @returns {boolean} `get` -  Current tweenChanges option value.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.tweenChanges = function (newTweenChanges) {
			if (!arguments.length) { // get
				return _options.tweenChanges;
			} else if (_options.tweenChanges != newTweenChanges) { // set
				_options.tweenChanges = newTweenChanges;
				ScrollScene.trigger("change", {what: "tweenChanges", newval: newTweenChanges}); // fire event
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the loglevel option value.
		 * @public
		 * @example
		 * // get the current loglevel
		 * var loglevel = scene.loglevel();
		 *
	 	 * // set new loglevel
		 * scene.loglevel(3);
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @param {number} [newLoglevel] - The new loglevel setting of the scene. `[0-3]`
		 * @returns {number} `get` -  Current loglevel.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.loglevel = function (newLoglevel) {
			if (!arguments.length) { // get
				return _options.loglevel;
			} else if (_options.loglevel != newLoglevel) { // set
				_options.loglevel = newLoglevel;
				ScrollScene.trigger("change", {what: "loglevel", newval: newLoglevel}); // fire event
			}
			return ScrollScene;
		};
		
		/**
		 * **Get** the current state.
		 * @public
		 * @example
		 * // get the current state
		 * var state = scene.state();
		 *
		 * @returns {string} `"BEFORE"`, `"DURING"` or `"AFTER"`
		 */
		this.state = function () {
			return _state;
		};
		
		/**
		 * **Get** the trigger offset relative to container.<br>
		 * This method calculates the starting offset of the scene, taking into account the triggerElement (if available) and the offset
		 * @public
		 * @example
		 * // get the trigger offset
		 * var triggerOffset = scene.triggerOffset();
		 *
		 * @returns {number} Numeric trigger offset, in relation to container (top value for vertical, left for horizontal).
		 */
		this.triggerOffset = function () {
			if (_parent) {
				if (_options.triggerElement === null) {
					// start where the trigger hook starts
					return _parent.info("size") * ScrollScene.triggerHook();
				} else {
					// Element as trigger
					var
						element = $(_options.triggerElement).first(),
						pin = _pin || $(), // so pin.get(0) doesnt return an error, if no pin exists.
						containerOffset = getOffset(_parent.info("container")); // container position is needed because element offset is returned in relation to document, not in relation to container.
						elementOffset = (pin.get(0) === element.get(0)) ? // if pin == trigger -> use spacer instead.	
										getOffset(_pinOptions.spacer) :			  // spacer
										getOffset(element);				  // trigger element

					if (!_parent.info("isDocument")) { // container is not the document root, so substract scroll Position to get correct trigger element position relative to scrollcontent
						containerOffset.top -= _parent.info("scrollPos");
						containerOffset.left -= _parent.info("scrollPos");
					}

					return _parent.info("vertical") ? elementOffset.top - containerOffset.top : elementOffset.left - containerOffset.left;
				}
			} else {
				// if there's no parent yet we don't know if we're scrolling horizontally or vertically
				return 0;
			}
		};

		/*
		 * ----------------------------------------------------------------
		 * public functions (scene modification)
		 * ----------------------------------------------------------------
		 */

		/**
		 * Update the Scene in the parent Controller<br>
		 * This is the equivalent to {@link ScrollMagic}.updateScene(scene, immediately)
		 * @public
		 * @example
		 * // update the scene on next tick
		 * scene.update();
		 *
		 * // update the scene immediately
		 * scene.update(true);
		 *
		 * @fires ScrollScene.update
		 *
		 * @param {boolean} [immediately=false] - If `true` the update will be instantly, if `false` it will wait until next tweenmax tick (better performance).
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.update = function (immediately) {
			if (_parent) {
				if (immediately) {
					var
						containerInfo = _parent.info(),
						startPos,
						endPos,
						newProgress;

					// get the start position
					startPos = ScrollScene.triggerOffset();

					// add optional offset
					startPos += _options.offset;

					// take triggerHook into account
					startPos -= containerInfo.size * ScrollScene.triggerHook();

					// where will the scene end?
					endPos = startPos + _options.duration;

					if (_options.duration > 0) {
						newProgress = (containerInfo.scrollPos - startPos)/(endPos - startPos);
					} else {
						newProgress = containerInfo.scrollPos >= startPos ? 1 : 0;
					}

					ScrollScene.trigger("update", {startPos: startPos, endPos: endPos, scrollPos: containerInfo.scrollPos});

					ScrollScene.progress(newProgress);
				} else {
					_parent.updateScene(ScrollScene, false);
				}
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the scene progress.<br>
		 * Usually it shouldn't be necessary to use this as a setter, as it is set automatically by scene.update().
		 * @public
		 * @example
		 * // get the current scene progress
		 * var progress = scene.progress();
		 *
	 	 * // set new scene progress
		 * scene.progress(0.3);
		 *
		 * @fires {@link ScrollScene.enter}, when used as setter
		 * @fires {@link ScrollScene.start}, when used as setter
		 * @fires {@link ScrollScene.progress}, when used as setter
		 * @fires {@link ScrollScene.end}, when used as setter
		 * @fires {@link ScrollScene.leave}, when used as setter
		 *
		 * @param {number} [progress] - The new progress value of the scene `[0-1]`.
		 * @returns {number} `get` -  Current scene progress.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.progress = function (progress) {
			if (!arguments.length) { // get
				return _progress;
			} else { // set
				var
					doUpdate = false,
					oldState = _state,
					scrollDirection = _parent ? _parent.info("scrollDirection") : "PAUSED";
				if (progress <= 0 && _state !== 'BEFORE' && (progress >= _progress || _options.reverse)) {
					// go back to initial state
					_progress = 0;
					_state = 'BEFORE';
					doUpdate = true;
				} else if (progress > 0 && progress < 1 && (progress >= _progress || _options.reverse)) {
					_progress = progress;
					_state = 'DURING';
					doUpdate = true;
				} else if (progress >= 1 && _state !== 'AFTER') {
					_progress = 1;
					_state = 'AFTER';
					doUpdate = true;
				} else if (_state === "DURING" && !_options.reverse) {
					updatePinState(); // in case we scrolled back and reverse is disabled => update the pin position, so it doesn't scroll back as well.
				}
				if (doUpdate) {
					// fire events
					var
						eventVars = {progress: _progress, state: _state, scrollDirection: scrollDirection},
						stateChanged = _state != oldState,
						instantReverse = (_state === 'BEFORE' && _options.duration == 0);

					if (stateChanged) {
						if (_state === 'DURING' || _options.duration == 0) {
							ScrollScene.trigger("enter", eventVars);
						}
						if (_state === 'BEFORE' || oldState === 'BEFORE') {
							ScrollScene.trigger(instantReverse ? "end" : "start", eventVars);
						}
					}
					ScrollScene.trigger("progress", eventVars);
					if (stateChanged) {
						if (_state === 'AFTER' || oldState === 'AFTER') {
							ScrollScene.trigger(instantReverse ? "start" : "end", eventVars);
						}
						if (_state !== 'DURING' || _options.duration == 0) {
							ScrollScene.trigger("leave", eventVars);
						}
					}
				}


				return ScrollScene;
			}
		};

		/**
		 * Add a tween to the scene.<br>
		 * If you want to add multiple tweens, wrap them into one TimelineMax object and add it.<br>
		 * The duration of the tween is streched to the scroll duration of the scene, unless the scene has a duration of `0`.
		 * @public
		 * @example
		 * // add a single tween
		 * scene.setTween(TweenMax.to("obj"), 1, {x: 100});
		 *
		 * // add multiple tweens, wrapped in a timeline.
		 * var timeline = new TimelineMax();
		 * var tween1 = TweenMax.from("obj1", 1, {x: 100});
		 * var tween2 = TweenMax.to("obj2", 1, {y: 100});
		 * timeline
		 *		.add(tween1)
		 *		.add(tween2);
		 * scene.addTween(timeline);
		 *
		 * @param {object} TweenMaxObject - A TweenMax, TweenLite, TimelineMax or TimelineLite object that should be animated in the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.setTween = function (TweenMaxObject) {
			if (_tween) { // kill old tween?
				ScrollScene.removeTween();
			}
			try {
				// wrap Tween into a TimelineMax Object to include delay and repeats in the duration and standardize methods.
				_tween = new TimelineMax({smoothChildTiming: true})
					.add(TweenMaxObject)
					.pause();
			} catch (e) {
				log(1, "ERROR calling method 'setTween()': Supplied argument is not a valid TweenMaxObject");
			} finally {
				// some propertties need to be transferred it to the wrapper, otherwise they would get lost.
				if (TweenMaxObject.repeat) { // TweenMax or TimelineMax Object?
					if (TweenMaxObject.repeat() === -1) {
						_tween.repeat(-1);
						_tween.yoyo(TweenMaxObject.yoyo());
					}
				}
				checkOptionsValidity();
				log(3, "added tween");
				updateTweenProgress();
				return ScrollScene;
			}
		};

		/**
		 * Remove the tween from the scene.
		 * @public
		 * @example
		 * // remove the tween from the scene without resetting it
		 * scene.removeTween();
		 *
		 * // remove the tween from the scene and reset it to initial position
		 * scene.removeTween(true);
		 *
		 * @param {boolean} [reset=false] - If `true` the tween will be reset to its initial values.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.removeTween = function (reset) {
			if (_tween) {
				if (reset) {
					updateTweenProgress(0);
				}
				_tween.kill();
				_tween = undefined;
				log(3, "removed tween (reset: " + (reset ? "true" : "false") + ")");
			}
			return ScrollScene;
		};

		/**
		 * Pin an element for the duration of the tween.<br>
		 * If the scene duration is 0 the element will never be unpinned.<br>
		 * Note, that pushFollowers has no effect, when the scene duration is 0.
		 * @public
		 * @example
		 * // pin element and push all following elements down by the amount of the pin duration.
		 * scene.setPin("#pin");
		 *
		 * // pin element and keeping all following elements in their place. The pinned element will move past them.
		 * scene.setPin("#pin", {pushFollowers: false});
		 *
		 * @param {(string|object)} element - A Selctor, a DOM Object or a jQuery object for the object that is supposed to be pinned.
		 * @param {object} [settings.pushFollowers=true] - If `true` following elements will be "pushed" down for the duration of the pin, if `false` the pinned element will just scroll past them.<br>
		 												   Ignored, when duration is `0`.
		 * @param {object} [settings.spacerClass="scrollmagic-pin-spacer"] - Classname of the pin spacer element, which is used to replace the element while pinning.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.setPin = function (element, settings) {
			var
				defaultSettings = {
					pushFollowers: true,
					spacerClass: "scrollmagic-pin-spacer"
				},
				settings = $.extend({}, defaultSettings, settings);

			// validate Element
			element = $(element).first();
			if (element.length == 0) {
				log(1, "ERROR calling method 'setPin()': Invalid pin element supplied.");
				return ScrollScene; // cancel
			}

			if (_pin) { // preexisting pin?
				if (_pin === element) {
					// same pin we already have -> do nothing
					return ScrollScene; // cancel
				} else {
					// kill old pin
					ScrollScene.removePin();
				}
				
			}
			_pin = element;
			
			// create spacer
			_pin.parent().hide(); // hack start to force jQuery css to return stylesheet values instead of calculated px values.
			var spacer = $("<div></div>")
					.addClass(settings.spacerClass)
					.css({
						position: "relative",
						display: _pin.css("display"),
						top: _pin.css("top"),
						left: _pin.css("left"),
						bottom: _pin.css("bottom"),
						right: _pin.css("right")
					});

			// set the pin Options
			_pinOptions = {
				spacer: spacer,
				marginCenter: _pin.css("margin-left") == "auto" && _pin.css("margin-left") == "auto",
				pushFollowers: settings.pushFollowers,
				origStyle: _pin.css(["position", "top", "left", "bottom", "right"]) // save old styles (for reset)
			};
			_pin.parent().show(); // hack end.

			// now place the pin element inside the spacer	
			_pin.before(spacer)
					.appendTo(spacer)
					// and set new css
					.css({
						position: "relative",
						top: "auto",
						left: "auto",
						bottom: "auto",
						right: "auto"
					});

			// add listener to document to update pin position in case controller is not the document.
			$(window).on("scroll resize", updatePinInContainer);

			log(3, "added pin");

			// finally update the pin to init
			updatePinState();

			return ScrollScene;
		};

		/**
		 * Remove the pin from the scene.
		 * @public
		 * @example
		 * // remove the pin from the scene without resetting it (the spacer is not removed)
		 * scene.removePin();
		 *
		 * // remove the pin from the scene and reset the pin element to its initial position (spacer is removed)
		 * scene.removePin(true);
		 *
		 * @param {boolean} [reset=false] - If `false` the spacer will not be removed and the element's position will not be reset.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.removePin = function (reset) {
			if (_pin) {
				if (reset || !_parent) { // if there's no parent no progress was made anyway...
					_pin.insertBefore(_pinOptions.spacer)
						.css(_pinOptions.origStyle);
					_pinOptions.spacer.remove();
				} else {
					var vertical = _parent.info("vertical");
					_pin.css({
						position: "absolute",
						top: vertical ? _options.duration * _progress : 0,
						left: vertical ? 0 : _options.duration * _progress
					});
				}
				$(window).off("scroll resize", updatePinInContainer);
				_pin = undefined;
				log(3, "removed pin (reset: " + (reset ? "true" : "false") + ")");
			}
			return ScrollScene;
		};

		/**
		 * Add the scene to a controller.<br>
		 * This is the equivalent to {@link ScrollMagic}.addScene(scene)
		 * @public
		 * @example
		 * // add a scene to a ScrollMagic controller
		 * scene.addTo(controller);
		 *
		 * @param {ScrollMagic} controller - The controller to which the scene should be added.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.addTo = function (controller) {
			if (_parent != controller) {
				// new parent
				if (_parent) { // I had a parent before, so remove it...
					_parent.removeScene(ScrollScene);
				}
				_parent = controller;
				checkOptionsValidity();
				updatePinSpacerSize();
				log(3, "added ScrollScene to controller");
				controller.addScene(ScrollScene);
				ScrollScene.update();
				return ScrollScene;
			}
		};

		/**
		 * Remove the scene from its parent controller.<br>
		 * This is the equivalent to {@link ScrollMagic}.removeScene(scene)
		 * The scene will not be updated anymore until you readd it to a controller.
		 * To remove the pin or the tween you need to call removeTween() or removePin() respectively.
		 * @public
		 * @example
		 * // remove the scene from its parent controller
		 * scene.remove();
		 *
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.remove = function () {
			if (_parent) {
				var tmpParent = _parent;
				_parent = undefined;
				log(3, "removed ScrollScene from controller");
				tmpParent.removeScene(ScrollScene);
			}
			return ScrollScene;
		};

		/**
		 * Destroy the scene and everything.
		 * @public
		 * @example
		 * // destroy the scene without resetting the pin and tween to their initial positions
		 * scene = scene.destroy();
		 *
		 * // destroy the scene and reset the pin and tween
		 * scene = scene.destroy(true);
		 *
		 * @param {boolean} [reset=false] - If `true` the pin and tween (if existent) will be reset.
		 * @returns {null} Null to unset handler variables.
		 */
		this.destroy = function (reset) {
			this.removeTween(reset);
			this.removePin(reset);
			this.remove();
			this.off("start end enter leave progress change update change.internal progress.internal")
			log(3, "destroyed ScrollScene (reset: " + (reset ? "true" : "false") + ")");
			return null;
		};

		/*
		 * ----------------------------------------------------------------
		 * EVENTS
		 * ----------------------------------------------------------------
		 */
		
		/**
		 * Scene start event.<br>
		 * Fires whenever the scroll position its the starting point of the scene.<br>
		 * It will also fire when scrolling back up going over the start position of the scene. If you want something to happen only when scrolling down/right, use the scrollDirection parameter passed to the callback.
		 *
		 * @event ScrollScene.start
		 *
		 * @example
		 * scene.on("start", function (event) {
		 * 		alert("Hit start point of scene.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"BEFORE"`, `"DURING"` or `"AFTER"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene end event.<br>
		 * Fires whenever the scroll position its the ending point of the scene.<br>
		 * It will also fire when scrolling back up from after the scene and going over its end position. If you want something to happen only when scrolling down/right, use the scrollDirection parameter passed to the callback.
		 *
		 * @event ScrollScene.end
		 *
		 * @example
		 * scene.on("end", function (event) {
		 * 		alert("Hit end point of scene.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"BEFORE"`, `"DURING"` or `"AFTER"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene enter event.<br>
		 * Fires whenever the scene enters the "DURING" state.<br>
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene enters its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * @event ScrollScene.enter
		 *
		 * @example
		 * scene.on("enter", function (event) {
		 * 		alert("Entered a scene.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"BEFORE"`, `"DURING"` or `"AFTER"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene leave event.<br>
		 * Fires whenever the scene's state goes from "DURING" to either "BEFORE" or "AFTER".<br>
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene leaves its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * @event ScrollScene.leave
		 *
		 * @example
		 * scene.on("leave", function (event) {
		 * 		alert("Left a scene.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"BEFORE"`, `"DURING"` or `"AFTER"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene update event.<br>
		 * Fires whenever the scene is updated (but not necessarily changes the progress).
		 *
		 * @event ScrollScene.update
		 *
		 * @example
		 * scene.on("update", function (event) {
		 * 		console.log("Scene updated.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.startPos - The starting position of the scene (in relation to the conainer)
		 * @property {number} event.endPos - The ending position of the scene (in relation to the conainer)
		 * @property {number} event.scrollPos - The current scroll position of the container
		 */
		/**
		 * Scene progress event.<br>
		 * Fires whenever the progress of the scene changes.
		 *
		 * @event ScrollScene.progress
		 *
		 * @example
		 * scene.on("progress", function (event) {
		 * 		console.log("Scene progress changed.");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene `"BEFORE"`, `"DURING"` or `"AFTER"`
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling `"PAUSED"`, `"FORWARD"` or `"REVERSE"`
		 */
		/**
		 * Scene change event.<br>
		 * Fires whenvever a property of the scene is changed.
		 *
		 * @event ScrollScene.change
		 *
		 * @example
		 * scene.on("change", function (event) {
		 * 		console.log("Scene Property \"" + event.what + "\" changed to " + event.newval);
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {string} event.what - Indicates what value has been changed
		 * @property {mixed} event.newval - The new value of the changed property
		 */
		 
		 /**
		 * Add one ore more event listener.<br>
		 * The callback function will be fired at the respective event, and an object containing relevant data will be passed to the callback.
		 * @public
		 *
		 * @example
		 * function callback (event) {
		 * 		console.log("Event fired! (" + event.type + ")");
		 * }
		 * // add listeners
		 * scene.on("change update progress start end enter leave", callback);
		 *
		 * @param {string} name - The name or names of the event the callback should be attached to.
		 * @param {function} callback - A function that should be executed, when the event is dispatched. An event object will be passed to the callback.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.on = function (name, callback) {
			if ($.isFunction(callback)) {
				var names = $.trim(name).toLowerCase()
							.replace(/(\w+)\.(\w+)/g, '$1.' + EVENT_NAMESPACE + '_$2') // add custom namespace, if one is defined
							.replace(/( |^)(\w+)( |$)/g, '$1$2.' + EVENT_NAMESPACE + '$3'); // add namespace to regulars.
				$(ScrollScene).on(names, callback);
			} else {
				log(1, "ERROR calling method 'on()': Supplied argument is not a valid callback!");
			}
			return ScrollScene;
		 };

		 /**
		 * Remove one or more event listener.
		 * @public
		 *
		 * @example
		 * function callback (event) {
		 * 		console.log("Event fired! (" + event.type + ")");
		 * }
		 * // add listeners
		 * scene.on("change update", callback);
		 * // remove listeners
		 * scene.off("change update", callback);
		 *
		 * @param {string} name - The name or names of the event that should be removed.
		 * @param {function} [callback] - A specific callback function that should be removed. If none is passed all callbacks to the event listener will be removed.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.off = function (name, callback) {
			var names = $.trim(name).toLowerCase()
						.replace(/(\w+)\.(\w+)/g, '$1.' + EVENT_NAMESPACE + '_$2') // add custom namespace, if one is defined
						.replace(/( |^)(\w+)( |$)/g, '$1$2.' + EVENT_NAMESPACE + '$3'); // add namespace to regulars.
			$(ScrollScene).off(names, callback)
			return ScrollScene;
		 };

		 /**
		 * Trigger an event.
		 * @public
		 *
		 * @example
		 * this.trigger("change");
		 *
		 * @param {string} name - The name of the event that should be triggered.
		 * @param {object} [vars] - An object containing info that should be passed to the callback.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.trigger = function (name, vars) {
			log(3, 'event fired:', name, "->", vars);
			var event = {
				type: $.trim(name).toLowerCase(),
				target: ScrollScene
			}
			if ($.isPlainObject(vars)) {
				event = $.extend({}, vars, event);
			}
			// fire all callbacks of the event
			$(ScrollScene).trigger(event);
			return ScrollScene;
		 };

		// INIT
		construct();
		return ScrollScene;
	};

	/*
	 * ----------------------------------------------------------------
	 * global logging functions and making sure no console errors occur
	 * ----------------------------------------------------------------
	 */
	var
		console = (window.console = window.console || {}),
		loglevels = [
			"error",
			"warn",
			"log"
		];
	if (!console.log) {
		console.log = $.noop; // no console log, well - do nothing then...
	}
	$.each(loglevels, function (index, method) { // make sure methods for all levels exist.
		if (!console[method]) {
			console[method] = console.log; // prefer .log over nothing
		}
	});
	// debugging function
	var debug = function (loglevel) {
		if (loglevel > loglevels.length || loglevel <= 0) loglevel = loglevels.length;
		var now = new Date(),
			time = ("0"+now.getHours()).slice(-2) + ":" + ("0"+now.getMinutes()).slice(-2) + ":" + ("0"+now.getSeconds()).slice(-2) + ":" + ("00"+now.getMilliseconds()).slice(-3),
			method = loglevels[loglevel-1],
			args = Array.prototype.splice.call(arguments, 1),
			func = Function.prototype.bind.call(console[method], console);

		args.unshift(time);
		func.apply(console, args);
	};
	// a helper function that should generally be faster than jQuery.offset() and can also return position in relation to viewport.
	function getOffset ($obj, relativeToViewport) {
		var  offset = {
				top: 0,
				left: 0
			};
		if ($obj.length > 0) {
			var obj = $obj.get(0);
			if (obj.getBoundingClientRect !== undefined) { // check if available
				var  rect = obj.getBoundingClientRect();
				offset.top = rect.top;
				offset.left = rect.left;
				if (!relativeToViewport) { // clientRect is by default relative to viewport...
					offset.top += $(document).scrollTop();
					offset.left += $(document).scrollLeft();
				}
			} else { // fall back to jquery
				offset = $obj.offset() || offset; // if element has offset undefined (i.e. document) use 0 for top and left
				if (relativeToViewport) { // jquery.offset is by default NOT relative to viewport...
					offset.top -= $(document).scrollTop();
					offset.left -= $(document).scrollLeft();
				}
			}
		}
		return offset;
	}

})(jQuery);