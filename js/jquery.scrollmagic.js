/*
	@overview
	ScrollMagic - The jQuery plugin for doing magical scroll animations
	by Jan Paepke 2014 (@janpaepke)

	Inspired by and partially based on the one and only SUPERSCROLLORAMA by John Polacek (@johnpolacek)
	johnpolacek.github.com/superscrollorama/

	Powered by the Greensock Tweening Platform
	http://www.greensock.com/js
	Greensock License info at http://www.greensock.com/licensing/

	Dual licensed under MIT and GPL.
	@author Jan Paepke, e-mail@janpaepke.de
*/

// TODO: fix pin when reverse=false and scrolling back up mid-scene
// TODO: when removing a scene add an option to reset the pin to how it would have looked if the scene was never added to a controller
// TODO: test / implement mobile capabilities
// TODO: test successive pins (animate, pin for a while, animate, pin...)
// TODO: make examples
// TODO: consider neccessity of a Scene.destroy method, that kills and resets everything
// TODO: consider how the scene should behave, if you start scrolling back up DURING the scene and reverse is false (ATM it will animate backwards)
// TODO: consider if the controller needs Events (like resize)
// TODO: consider how to better control forward/backward animations (for example have different animations, when scrolling up, than when scrolling down)
// TODO: consider using 0, -1 and 1 for the scrollDirection instead of "PAUSED", "FORWARD" and "BACKWARD"
// TODO: consider logs - what should be logged and where
// TODO: consider if updating Scene immediately, when added to controller may cause problems or might not be desired in some cases
// TODO: consider making public ScrollScene variables private

(function($) {
	/**
	 * CLASS ScrollMagic (main controller)
	 *
	 * (TODO: Description)
	 *
	 * @constructor
	 *
	 * @param {object} [options] - An object containing one or more options for the controller.
	 * @param {(string|object)} [options.scrollContainer=$(window)] - A selector or a jQuery object that references the main container for scrolling.
	 * @param {boolean} [options.isVertical=true] - Sets the scroll mode to vertical (true) or horizontal (false) scrolling.
	 * @param {object} [options.globalSceneOptions=true] - These options will be passed to every Scene that is added to the controller using the addScene method. For more information on Scene options @see {@link ScrollScene)
	 * @param {number} [options.loglevel=2] - Loglevel for debugging. 0: silent | 1: errors | 2: errors,warnings | 3: errors,warnings,debuginfo
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
				scrollContainer: $(window),
				isVertical: true,
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
			_currScrollPos = 0,
			_scrollDirection = "PAUSED",
			_viewPortSize = 0;

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
			_options.scrollContainer = $(_options.scrollContainer).first()
			// check ScrolContainer
			if (_options.scrollContainer.length == 0) {
				log(1, "ERROR creating object ScrollMagic: No valid scroll container supplied");
				return; // cancel
			}
			// update container size immediately
			_viewPortSize = _options.isVertical ? _options.scrollContainer.height() : _options.scrollContainer.width();
			// set event handlers
			_options.scrollContainer.on("scroll", function(e) {
				var oldScrollPos = _currScrollPos;
				_currScrollPos = _options.isVertical ? _options.scrollContainer.scrollTop() : _options.scrollContainer.scrollLeft();
				var deltaScroll = _currScrollPos - oldScrollPos;
				_scrollDirection = (deltaScroll == 0) ? "PAUSED" : (deltaScroll > 0) ? "FORWARD" : "REVERSE";
				_updateScenesOnNextTick = true;
			});
			_options.scrollContainer.on("resize", function(e) {
				_viewPortSize = _options.isVertical ? _options.scrollContainer.height() : _options.scrollContainer.width();
				_updateScenesOnNextTick = true;
			});

			// prefer on Ticker, but don't rely on TweenMax for basic functionality
			try {
				TweenLite.ticker.addEventListener("tick", onTick);
			}
			catch (e) {}
			finally {
				window.setInterval(onTick, 30);
			}
		};

		/**
		* Handle updates on tick instad of on scroll (performance)
		* @private
		*/
		var onTick = function () {
			if (_updateScenesOnNextTick) {
				if ($.isArray(_updateScenesOnNextTick)) {
					// update specific scenes
					$.each(_updateScenesOnNextTick, function (index, scene) {
							ScrollMagic.updateScene(scene, true);
					});
				} else {
					// update all scenes
					ScrollMagic.updateAllScenes(true);
				}
				_updateScenesOnNextTick = false;
			}
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
					prefix = "(ScrollContainer) ->",
					args = Array.prototype.splice.call(arguments, 1),
					func = Function.prototype.bind.call(debug, window);
				args.unshift(loglevel, prefix);
				func.apply(window, args);
			}
		}

		/*
		 * ----------------------------------------------------------------
		 * public functions
		 * ----------------------------------------------------------------
		 */

		/**
		 * Add a Scene to the controller.
		 * @public
		 *
		 * @param {ScrollScene} scene - The ScollScene to be added.
		 * @return {ScrollMagic} - Parent object for chaining.
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
				ScrollMagic.updateScene(ScrollScene, true);
			}
			return ScrollMagic;
		};

		/**
		 * Remove scene from the controller.
		 * @public

		 * @param {ScrollScene} scene - The ScollScene to be removed.
		 * @returns {ScrollMagic} Parent object for chaining.
		 */
		this.removeScene = function (ScrollScene) {
			var index = $.inArray(ScrollScene, _sceneObjects);
			if (index > -1) {
				_sceneObjects.splice(index, 1);
				ScrollScene.remove();
			}
			return ScrollMagic;
		};



		/**
		 * Update a specific scene according to the scroll position of the container.
		 * @public
		 *
		 * @param {ScrollScene} scene - The ScollScene object that is supposed to be updated.
		 * @param {boolean} [immediately=false] - If true the update will be instantly, if false it will wait until next tweenmax tick (better performance);
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
		 * Update all scenes according to their scroll position within the container.
		 * @public
		 *
		 * @param {boolean} [immediately=false] - If true the update will be instantly, if false it will wait until next tweenmax tick (better performance);
		 * @return {ScrollMagic} Parent object for chaining.
		 */
		this.updateAllScenes = function (immediately) {
			if (immediately) {
				$.each(_sceneObjects, function (index, scene) {
					ScrollMagic.updateScene(scene, true);
				});
			} else {
				_updateScenesOnNextTick = true;
			}
			return ScrollMagic;
		};

		/**
		 * Get the viewport size.
		 * @public
		 *
		 * @returns {float} - The height or width of the viewport (depending wether we're in horizontal or vertical mode)
		 */
		this.info = function (about) {
			var values = {
				size: _viewPortSize, // contains height or width (in regard to orientation);
				scrollPos: _currScrollPos,
				vertical: _options.isVertical,
				scrollDirection: _scrollDirection,
				container: _options.scrollContainer
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

		// INIT
		construct();
		return ScrollMagic;
	};


	/**
	 * CLASS ScrollScene (scene controller)
	 *
	 * @constructor
	 *
	 * @param {object} [options] - Options for the Scene. (Can be changed lateron)
	 * @param {number} [options.duration=0] - The duration of the scene. If 0 tweens will auto-play when reaching the scene start point, pins will be pinned indefinetly starting at the start position.
	 * @param {number} [options.offset=0] - Offset Value for the Trigger Position
	 * @param {(string|object)} [options.triggerElement] - An Element that defines the start of the scene. Can be a Selector (string), a jQuery Object or a HTML Object. If undefined the scene will start right at the beginning (unless an offset is set).
	 * @param {(float|string)} [options.triggerHook="onCenter"] - Can be string "onCenter", "onEnter", "onLeave" or float (0 - 1), 0 = onLeave, 1 = onEnter
	 * @param {boolean} [options.reverse=true] - Should the scene reverse, when scrolling up?
	 * @param {boolean} [options.smoothTweening=false] - Tweens Animation to the progress target instead of setting it. Does not affect animations where duration=0
	 * @param {number} [options.loglevel=2] - Loglevel for debugging. 0: none | 1: errors | 2: errors,warnings | 3: errors,warnings,debuginfo
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
			DEFAULT_OPTIONS = {
				duration: 0,
				offset: 0,
				triggerElement: null,
				triggerHook: TRIGGER_HOOK_STRINGS[0],
				reverse: true,
				smoothTweening: false,
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
			_startPoint = 0, // recalculated on update
			_parent = null,
			_tween,
			_pin;


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
		};

		/**
		 * Check the validity of all options and reset to default if neccessary.
		 * @private
		 */
		var checkOptionsValidity = function () {
			if (!$.isNumeric(_options.duration) || _options.duration < 0) {
				log(1, "ERROR: Invalid value for ScrollScene option \"duration\":", _options.duration);
				_options.duration = DEFAULT_OPTIONS.duration;
			}
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
			var progress = (to > 0 && to < 1) ? to : _progress;
			if (_tween) {
				if (_tween.repeat() === -1) {
					// infinite loop, so not in relation to progress
					if ((_state === "DURING" || (_state === "AFTER" && _options.duration == 0)) && _tween.paused()) {
						_tween.play();
						// TODO: optional: think about running the animation in reverse (.reverse()) when starting scene from bottom. Desired behaviour? Might require tween.yoyo() to be true
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
						if (_options.smoothTweening) {
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
		 * Update the pin progress.
		 * @private
		 */
		var updatePinState = function () {
			// TODO: check/test functionality – especially for horizontal scrolling
			if (_pin && _parent) {
				var 
					css,
					spacer =  _pin.parent();

				if (_state === "BEFORE") {
					// original position
					css = {
						position: "absolute",
						top: 0,
						left: 0
					}
				} else if (_state === "AFTER" && _options.duration > 0) { // if duration is 0 - we just never unpin
					// position after pin
					css = {
						position: "absolute",
						top: _parent.info("vertical") ? _options.duration : 0,
						left: _parent.info("vertical") ? 0 : _options.duration
					}
				} else {
					// position during pin
					var
						spacerOffset = spacer.offset(),
						fixedPosTop,
						fixedPosLeft;

					if (_parent.info("vertical")) {
						fixedPosTop = spacerOffset.top - _startPoint;
						fixedPosLeft = spacerOffset.left;
					} else {
						fixedPosTop = spacerOffset.top;
						fixedPosLeft = spacerOffset.left - _startPoint;
					}
					// TODO: make sure calculation is correct for all scenarios.
					css = {
						position: "fixed",
						top: fixedPosTop,
						left: fixedPosLeft
					}
				}
				_pin.css(css);
			}
		};

		/**
		 * Update the pin spacer size.
		 * The size of the spacer needs to be updated whenever the duration of the scene changes, if it is to push down following elements.
		 * @private
		 */
		var updatePinSpacerSize = function () {
			if (_pin && _parent) {
				if (_pin.data("pushFollowers")) {
					var spacer = _pin.parent();
					if (_parent.info("vertical")) {
						spacer.height(_pin.data("startHeight") + _options.duration);
					} else {
						spacer.width(_pin.data("startWidth") + _options.duration);
					}
					// UPDATE progress, because when the spacer size is changed it may affect the pin state
					updatePinState();
				}
			}
		}

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

		/*
		 * ----------------------------------------------------------------
		 * public functions
		 * ----------------------------------------------------------------
		 */

		/**
		 * Get parent controller.
		 * @public
		 *
		 * @returns {ScrollMagic} Parent controller or null
		 */
		this.parent = function () {
			return _parent;
		};


		/**
		 * Get duration option value.
		 * @public
		 *
		 * @returns {number}
		 *//**
		 * Set duration option value.
		 * @public
		 *
		 * @fires ScrollScene.change
		 * @param {number} newDuration - The new duration of the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.duration = function (newDuration) {
			if (!arguments.length) { // get
				return _options.duration;
			} else if (_options.duration != newDuration) { // set
				_options.duration = newDuration;
				checkOptionsValidity();
				ScrollScene.dispatch("change", {what: "duration"}); // fire event
				// update some shit
				updatePinSpacerSize();
				ScrollScene.update();
			}
			return ScrollScene;
		};

		/**
		 * Get offset option value.
		 * @public
		 *
		 * @returns {number}
		 *//**
		 * Set offset option value.
		 * @public
		 *
		 * @fires ScrollScene.change
		 * @param {number} newOffset - The new offset of the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.offset = function (newOffset) {
			if (!arguments.length) { // get
				return _options.offset;
			} else if (_options.offset != newOffset) { // set
				_options.offset = newOffset;
				checkOptionsValidity();
				ScrollScene.dispatch("change", {what: "offset"}); // fire event
				ScrollScene.update();
			}
			return ScrollScene;
		};

		/**
		 * Get triggerElement.
		 * @public
		 *
		 * @returns {(number|object)}
		 *//**
		 * Set triggerElement.
		 * @public
		 *
		 * @fires ScrollScene.change
		 * @param {(number|object)} newTriggerElement - The new trigger element for the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.triggerElement = function (newTriggerElement) {
			if (!arguments.length) { // get
				return _options.triggerElement;
			} else if (_options.triggerElement != newTriggerElement) { // set
				_options.triggerElement = newTriggerElement;
				checkOptionsValidity();
				ScrollScene.dispatch("change", {what: "triggerElement"}); // fire event
				ScrollScene.update();
			}
			return ScrollScene;
		};

		/**
		 * Get triggerHook relative to viewport.
		 * @public
		 *
		 * @returns {number} A number from 0 to 1 that defines where on the viewport the offset and startPosition should be related to.
		 *//**
		 * Set triggerHook option value.
		 * @public
		 *
		 * @fires ScrollScene.change
		 * @param {(float|string)} newTriggerHook - The new triggerHook of the scene. @see {@link ScrollScene) parameter description for value options.
		 * @returns {ScrollScene} Parent object for chaining.
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
				checkOptionsValidity();
				ScrollScene.dispatch("change", {what: "triggerHook"}); // fire event
				ScrollScene.update();
			}
			return ScrollScene;
		};

		/**
		 * Get reverse option value.
		 * @public
		 *
		 * @returns {boolean}
		 *//**
		 * Set reverse option value.
		 * @public
		 *
		 * @fires ScrollScene.change
		 * @param {boolean} newReverse - The new reverse setting of the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.reverse = function (newReverse) {
			if (!arguments.length) { // get
				return _options.reverse;
			} else if (_options.reverse != newReverse) { // set
				_options.reverse = newReverse;
				checkOptionsValidity();
				ScrollScene.dispatch("change", {what: "reverse"}); // fire event
				ScrollScene.update();
			}
			return ScrollScene;
		};

		/**
		 * Get smoothTweening option value.
		 * @public
		 *
		 * @returns {boolean}
		 *//**
		 * Set smoothTweening option value.
		 * @public
		 *
		 * @fires ScrollScene.change
		 * @param {boolean} newSmoothTweening - The new smoothTweening setting of the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.smoothTweening = function (newSmoothTweening) {
			if (!arguments.length) { // get
				return _options.smoothTweening;
			} else if (_options.smoothTweening != newSmoothTweening) { // set
				_options.smoothTweening = newSmoothTweening;
				checkOptionsValidity();
				ScrollScene.dispatch("change", {what: "smoothTweening"}); // fire event
				ScrollScene.update();
			}
			return ScrollScene;
		};

		/**
		 * Get loglevel option value.
		 * @public
		 *
		 * @returns {number}
		 *//**
		 * Set loglevel option value.
		 * @public
		 *
		 * @fires ScrollScene.change
		 * @param {number} newLoglevel - The new loglevel setting of the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.loglevel = function (newLoglevel) {
			if (!arguments.length) { // get
				return _options.loglevel;
			} else if (_options.loglevel != newLoglevel) { // set
				_options.loglevel = newLoglevel;
				checkOptionsValidity();
				ScrollScene.dispatch("change", {what: "loglevel"}); // fire event
				// no need to update the scene with this param...
			}
			return ScrollScene;
		};


		/**
		 * Get Scene progress (0 - 1). 
		 * @public
		 *
		 * @returns {number}
		 *//**
		 * Set Scene progress.
		 * @public
		 *
		 * @fires ScrollScene.enter
		 * @fires ScrollScene.start
		 * @fires ScrollScene.progress
		 * @fires ScrollScene.end
		 * @fires ScrollScene.leave
		 *
		 * @param {number} progress - The new progress value of the scene (0 - 1).
		 * @returns {ScrollScene} Parent object for chaining.
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
					doUpdate = true;
					_state = 'BEFORE';
				} else if (progress > 0 && progress < 1 && (progress >= _progress || _options.reverse)) {
					_progress = progress;
					doUpdate = true;
					_state = 'DURING';
				} else if (progress >= 1 && _state !== 'AFTER') {
					_progress = 1;
					doUpdate = true;
					_state = 'AFTER';
				}
				if (doUpdate) {
					// fire events
					var eventVars = {scrollDirection: scrollDirection, state: _state};
					if (_state != oldState) { // fire state change events
						if (_state === 'DURING' || _options.duration == 0) {
							ScrollScene.dispatch("enter", eventVars);
						}
						if ((_state === 'DURING' && scrollDirection === 'FORWARD')|| _state === 'BEFORE') {
							ScrollScene.dispatch("start", eventVars);
						} else if (_options.duration == 0) {
							ScrollScene.dispatch((_state === 'AFTER') ? "start" : "end", eventVars);
						}
					}

					// do actual updates
					updateTweenProgress();
					if (_state != oldState) { // update pins only if something changes
						updatePinState();
					}

					// fire some more events
					ScrollScene.dispatch("progress", {progress: _progress, scrollDirection: scrollDirection});
					if (_state != oldState) { // fire state change events
						if ((_state === 'DURING' && scrollDirection === 'REVERSE')|| _state === 'AFTER') {
							ScrollScene.dispatch("end", {scrollDirection: scrollDirection});
						} else if (_options.duration == 0) {
							ScrollScene.dispatch((_state === 'AFTER') ? "start" : "end", eventVars);
						}
						if (_state !== 'DURING' || _options.duration == 0) {
							ScrollScene.dispatch("leave", eventVars);
						}
					}
				}

				log(3, "Scene Progress", {"progress" : _progress, "state" : _state, "reverse" : _options.reverse});

				return ScrollScene;
			}
		};

		/**
		 * Add a tween to the scene (one TweenMax object per scene!).
		 * @public
		 *
		 * @param {object} TweenMaxObject - A TweenMax object that should be animated during the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.setTween = function (TweenMaxObject) {
			if (_tween) { // kill old tween?
				ScrollScene.removeTween();
			}
			try {
				// wrap Tween into a TimelineMax Object to include delay and repeats in the duration and standardize methods.
				_tween = new TimelineMax()
					.add(TweenMaxObject)
					.pause();
			} catch (e) {
				log(1, "ERROR calling method 'setTween()': Supplied argument is not a valid TweenMaxObject");
			} finally {
				if (TweenMaxObject.repeat) {
					if (TweenMaxObject.repeat() === -1) {
						// if the tween Object has an infinite loop we need to transfer it to the wrapper, otherwise it would get lost.
						_tween.repeat(-1);
					}
				}
				checkOptionsValidity();
				updateTweenProgress();
				return ScrollScene;
			}
		};

		/**
		 * Remove the tween from the scene.
		 * @public
		 *
		 * @param {boolean} [reset=false] - If true the tween weill be reset to start values.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.removeTween = function (reset) {
			if (_tween) {
				if (reset) {
					updateTweenProgress(0);
				}
				_tween.kill();
				_tween = null;
			}
			return ScrollScene;
		};


		/**
		 * Pin an element for the duration of the tween.
		 * @public
		 *
		 * @param {(string|object)} element - A Selctor or a jQuery object for the object that is supposed to be pinned.
		 * @param {object} [settings.pushFollowers=true] - If true following elements will be "pushed" down, if false the pinned element will just scroll past them
		 * @param {object} [settings.spacerClass="superscrollorama-pin-spacer"] - Classname of the pin spacer element
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.setPin = function (element, settings) {
			var defaultSettings = {
				pushFollowers: true,
				spacerClass: "superscrollorama-pin-spacer"
			};

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

			_pin.parent().hide(); // hack start to force jQuery css to return percentage values instead of calculated ones.
			var
				settings = $.extend({}, defaultSettings, settings),				
				// create spacer
				spacer = $("<div>&nbsp;</div>") // for some reason a completely empty div can cause layout changes sometimes.
					.addClass(settings.spacerClass)
					.css({
						position: "relative",
						top: _pin.css("top"),
						left: _pin.css("left"),
						bottom: _pin.css("bottom"),
						right: _pin.css("right")
					});
			_pin.parent().show(); // hack end.

			if (_pin.css("position") == "absolute") {
				// well this is easy.
				// TODO: Testing
				spacer.css({
						width: 0,
						height: 0
					});
			} else {
				// copy size so element will replace pinned element in DOM
				spacer.css({
						display: _pin.css("display"),
						width: _pin.outerWidth(true),
						height: _pin.outerHeight(true)
					});
			}


			// now place the pin element inside the spacer	
			_pin.wrap(spacer)
					// save old styles (for reset)
					// TODO: check if implemented. Maybe only save position, top, left, bottom, right?
					.data("style", _pin.attr("style") || "")
					// save some data for (re-)calculating pin spacer size
					.data("pushFollowers", settings.pushFollowers)
					.data("startWidth", spacer.width())
					.data("startHeight", spacer.height())
					// set new css
					.css({
						position: "absolute",
						top: 0,
						left: 0,
						bottom: "auto",
						right: "auto"
					});

			// update the size of the pin Spacer.
			// this also calls updatePinState
			updatePinSpacerSize();

			return ScrollScene;
		};

		
		/**
		 * Remove the pin from the scene.
		 * @public
		 *
		 * @param {boolean} [reset=false] - If false the spacer will not be removed and the element's position will not be reset.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.removePin = function (reset) {
			if (_pin) {
				var spacer = _pin.parent();
				if (reset || !_parent) { // if there's no parent no progress was made anyway...
					_pin.insertBefore(spacer)
						.attr("style", _pin.data("style"));
					spacer.remove();
				} else {
					var vertical = _parent.info("vertical");
					_pin.css({
						position: "absolute",
						top: vertical ? _options.duration * _progress : 0,
						left: vertical ? 0 : _options.duration * _progress
					});
				}
				_pin = null;
			}
			return ScrollScene;
		};
		
		/**
		 * Update the Scene in the parent Controller
		 * Can also be achieved using controller.update(scene);
		 * @public
		 *
		 * @param {boolean} [immediately=false] - If true the update will be instantly, if false it will wait until next tweenmax tick (better performance);
		 * @returns {ScrollScene}
		 */
		this.update = function (immediately) {
			if (_parent) {
				if (immediately) {
					var
						containerInfo = _parent.info(),
						endPoint,
						newProgress;

					// get the start position
					_startPoint = ScrollScene.getTriggerOffset();

					// add optional offset
					_startPoint += _options.offset;

					// TODO: account for the possibility that the parent is a div, not the document
					// startPoint -= _containerInnerOffset;

					// take triggerHook into account
					_startPoint -= containerInfo.size * ScrollScene.triggerHook();

					// where will the scene end?
					endPoint = _startPoint + _options.duration;

					if (_options.duration > 0) {
						newProgress = (containerInfo.scrollPos - _startPoint)/(endPoint - _startPoint);
					} else {
						newProgress = containerInfo.scrollPos > _startPoint ? 1 : 0;
					}
					
					// startPoint is neccessary inside the class for the calculation of the fixed position for pins.
					// ScrollScene.startPoint = startPoint;

					log(3, "Scene Update", {"startPoint" : _startPoint, "endPoint" : endPoint,"curScrollPos" : containerInfo.scrollPos});

					ScrollScene.progress(newProgress);
				} else {
					_parent.updateScene(ScrollScene, false);
				}
			}
			return ScrollScene;
		};
		
		/**
		 * Remove the scene from its parent controller.
		 * Can also be achieved using controller.removeScene(scene);
		 * To remove the pin and/or pin spacer you need to call removePin
		 * @public
		 *
		 * @returns {ScrollScene}
		 */
		this.remove = function () {
			if (_parent) {
				_parent.removeScene(ScrollScene);
				_parent = null;
			}
			return ScrollScene;
		};

		/**
		 * Add the scene to a controller.
		 * Can also be achieved using controller.addScene(scene);
		 * @public
		 *
		 * @param {ScrollMagic} controller - The controller to which the scene should be added.
		 * @returns {ScrollScene}
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
				controller.addScene(ScrollScene);
				return ScrollScene;
			}
		};
		
		/**
		 * Return the trigger offset.
		 * (always numerical, whereas triggerElement can be a jQuery/HTML object or nothing)
		 * @public
		 *
		 * @returns {number} Numeric trigger offset, in relation to scroll direction
		 */
		this.getTriggerOffset = function () {
			if (_parent) {
				if (_options.triggerElement === null) {
					// start where the trigger hook starts
					return _parent.info("size") * ScrollScene.triggerHook();
				} else {
					// Element as trigger
					var
						element = $(_options.triggerElement).first(),
						pin = _pin || $(), // so pin.get(0) doesnt return an error, if no pin exists.
						containerOffset = _parent.info("container").offset() || {top: 0, left: 0},
						triggerOffset;

					if (pin.get(0) === element.get(0)) { // if  pin == trigger -> use spacer instead.	
						triggerOffset = pin.parent().offset(); // spacer
					} else {
						triggerOffset = element.offset(); // trigger element
					}

					if ($.contains(document, _parent.info("container").get(0))) { // not the document root, so substract scroll Position to get correct trigger element position relative to scrollcontent
						containerOffset.top -= _parent.info("scrollPos");
						containerOffset.left -= _parent.info("scrollPos");
					}

					return _parent.info("vertical") ? triggerOffset.top - containerOffset.top : triggerOffset.left - containerOffset.left;
				}
			} else {
				// if there's no parent yet we don't know if we're scrolling horizontally or vertically
				return 0;
			}
		};


		/*
		 * ----------------------------------------------------------------
		 * EVENTS
		 * ----------------------------------------------------------------
		 */
		
		/**
		 * Scene start event.
		 * Fires whenever the scroll position its the starting point of the scene.
		 * It will also fire when scrolling back up going over the start position of the scene. If you want something to happen only when scrolling down/right, use the scrollDirection parameter passed to the callback.
		 *
		 * @event ScrollScene.start
		 *
		 * @property {object} event - The event Object passed to each callback.
		 * @property {string} event.type - The unique name of the event.
		 * @property {string} event.state - The new state of the scene. Will be "DURING" or "BEFORE"
		 * @property {string} event.scrollDirection - Indicates wether we hit the start position into the scene ("FORWARD") or backing up and scrolling out of it ("REVERSE").
		 */
		/**
		 * Scene end event.
		 * Fires whenever the scroll position its the ending point of the scene.
		 * It will also fire when scrolling back up from after the scene and going over its end position. If you want something to happen only when scrolling down/right, use the scrollDirection parameter passed to the callback.
		 *
		 * @event ScrollScene.end
		 *
		 * @property {object} event - The event Object passed to each callback.
		 * @property {string} event.type - The unique name of the event.
		 * @property {string} event.state - The new state of the scene. Will be "AFTER" or "DURING"
		 * @property {string} event.scrollDirection - Indicates wether we hit the end position scrolling out of the scene ("FORWARD") or backing up into it ("REVERSE").
		 */
		/**
		 * Scene enter event.
		 * Fires whenever the scene enters the "DURING" state.
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene enters its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * @event ScrollScene.enter
		 *
		 * @property {object} event - The event Object passed to each callback.
		 * @property {string} event.type - The unique name of the event.
		 * @property {string} event.state - The new state of the scene. Will always be "DURING" (only included for consistency)
		 * @property {string} event.scrollDirection - Indicates from what side we enter the Scene. ("FORWARD") => from the top/left, ("REVERSE") => from the bottom/right.
		 */
		/**
		 * Scene leave event.
		 * Fires whenever the scene's state goes from "DURING" to either "BEFORE" or "AFTER".
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene leaves its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * @event ScrollScene.leave
		 *
		 * @property {object} event - The event Object passed to each callback.
		 * @property {string} event.type - The unique name of the event.
		 * @property {string} event.state - The new state of the scene. Will be "AFTER" or "BEFORE"
		 * @property {string} event.scrollDirection - Indicates towards which side we leave the Scene. ("FORWARD") => going to state "BEFORE", ("REVERSE") => going to state "AFTER"
		 */
		/**
		 * Scene progress event.
		 * Fires whenever the progress of the scene changes.
		 *
		 * @event ScrollScene.progress
		 *
		 * @property {object} event - The event Object passed to each callback.
		 * @property {string} event.type - The unique name of the event.
		 * @property {number} event.progress - Reflects the current progress of the scene.
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling "FORWARD" or "REVERSE"
		 */
		/**
		 * Scene change event.
		 * Fires whenvever a property of the scene is changed.
		 *
		 * @event ScrollScene.change
		 *
		 * @property {object} event - The event Object passed to each callback.
		 * @property {string} event.type - The unique name of the event.
		 * @property {string} event.what - Indicates what value has been changed.
		 */
		 
		 /**
		 * Add an event listener.
		 * The callback function will be fired at the respective event, and an object containing relevant data will be passed to the callback.
		 * @public
		 *
		 * @param {string} name - The name of the event the callback should be attached to.
		 * @param {function} callback - A function that should be executed, when the event is dispatched. An event object will be passed to the callback.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.on = function (name, callback) {
			if ($.isFunction(callback)) {
		 		$(document).on($.trim(name.toLowerCase()) + ".ScrollScene", callback);
			} else {
				log(1, "ERROR calling method 'on()': Supplied argument is not a valid callback!");
			}
			return ScrollScene;
		 }

		 /**
		 * Remove an event listener.
		 * @public
		 *
		 * @param {string} [name] - The name of the event that should be removed. If none is passed, all event listeners will be removed.
		 * @param {object} [callback] - A specific callback function that should be removed. If none is passed all callbacks to the event listener will be removed.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.unbind = function (name, callback) {
		 	// console.log(_events);
		 	$(document).off($.trim(name.toLowerCase()) + ".ScrollScene", callback)
		 	return ScrollScene;
		 }

		 /**
		 * Trigger an event.
		 * @public
		 *
		 * @param {string} name - The name of the event that should be fired.
		 * @param {object} [vars] - An object containing info that should be passed to the callback.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.dispatch = function (name, vars) {
			log(3, 'Event Fired: ScrollScene.'+name);
			var event = {
				type: $.trim(name.toLowerCase()) + ".ScrollScene",
				target: ScrollScene
			}
	 		if ($.isPlainObject(vars)) {
				event = $.extend({}, vars, event);
			}
			// fire all callbacks of the event
			$.event.trigger(event);
			return ScrollScene;
		 }




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
	if (!console['log']) {
		console.log = $.noop; // no console log, well - do nothing then...
	}
	$.each(loglevels, function (index, method) { // make sure methods for all levels exist.
		if (!console[method]) {
			console[method] = console.log; // prefer .log over nothing
		}
	});
	// global debugging function
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

	/*
	 * ----------------------------------------------------------------
	 * helpers
	 * ----------------------------------------------------------------
	 */

	// TODO: Kill?
	function getBounds ($obj, inViewport) {
		var 
			bounds = {
				width: 0,
				height: 0,
				top: 0,
				left: 0,
				bottom: 0,
				right: 0
			};

		if ($obj.length > 0) {
			var
				obj = $obj.get(0),
				scrollTop = Math.max(window.pageYOffset || 0, document.documentElement.scrollTop || 0, window.scrollY || 0, document.body.scrollTop || 0),
				scrollLeft = Math.max(window.pageXOffset || 0, document.documentElement.scrollLeft || 0, window.scrollX || 0, document.body.scrollLeft || 0);

			if (obj.getBoundingClientRect) { // check if available
				var
					rect = obj.getBoundingClientRect();

				bounds = {
					top: rect.top + scrollTop,
					left: rect.left + scrollLeft,
					width: rect.width,
					height: rect.height
				};
			} else { // fall back to jquery
				bounds = $obj.offset();
			}
			// add width and hight (fallback for stupid IE8)
			if (!bounds.width) {
				bounds.width = $obj.width();
			}
			if (!bounds.height) {
				bounds.height = $obj.height();
			}

			if (inViewport) { // correct if should be in relation to viewport
				bounds.top = bounds.top - scrollTop;
				bounds.left = bounds.left - scrollLeft;
			}

			// add bottom / right bounds
			bounds.bottom = bounds.top + bounds.height;
			bounds.right = bounds.left + bounds.width;
		}
		return bounds;
	}

})(jQuery);