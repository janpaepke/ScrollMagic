	/**
	 * A ScrollScene defines where the controller should react and how.
	 *
	 * @class
	 * @global
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
	 * @param {object} [options] - Options for the Scene. The options can be updated at any time.  
	 							   Instead of setting the options for each scene individually you can also set them globally in the controller as the controllers `globalSceneOptions` option. The object accepts the same properties as the ones below.  
	 							   When a scene is added to the controller the options defined using the ScrollScene constructor will be overwritten by those set in `globalSceneOptions`.
	 * @param {(number|function)} [options.duration=0] - The duration of the scene. 
	 										  If `0` tweens will auto-play when reaching the scene start point, pins will be pinned indefinetly starting at the start position.  
	 										  A function retuning the duration value is also supported. Please see `ScrollScene.duration()` for details.
	 * @param {number} [options.offset=0] - Offset Value for the Trigger Position. If no triggerElement is defined this will be the scroll distance from the start of the page, after which the scene will start.
	 * @param {(string|object)} [options.triggerElement=null] - Selector, DOM object or jQuery Object that defines the start of the scene. If undefined the scene will start right at the start of the page (unless an offset is set).
	 * @param {(number|string)} [options.triggerHook="onCenter"] - Can be a number between 0 and 1 defining the position of the trigger Hook in relation to the viewport.  
	 															  Can also be defined using a string:
	 															  ** `"onEnter"` => `1`
	 															  ** `"onCenter"` => `0.5`
	 															  ** `"onLeave"` => `0`
	 * @param {boolean} [options.reverse=true] - Should the scene reverse, when scrolling up?
	 * @param {boolean} [options.tweenChanges=false] - Tweens Animation to the progress target instead of setting it.  
	 												   Does not affect animations where duration is `0`.
	 * @param {number} [options.loglevel=2] - Loglevel for debugging. Note that logging is disabled in the minified version of ScrollMagic.
	 										  ** `0` => silent
	 										  ** `1` => errors
	 										  ** `2` => errors, warnings
	 										  ** `3` => errors, warnings, debuginfo
	 * 
	 */
	var ScrollScene = function (options) {

		/*
		 * ----------------------------------------------------------------
		 * settings
		 * ----------------------------------------------------------------
		 */

		var
			TRIGGER_HOOK_VALUES = {"onCenter" : 0.5, "onEnter" : 1, "onLeave" : 0},
			NAMESPACE = "ScrollScene",
			DEFAULT_OPTIONS = {
				duration: 0,
				offset: 0,
				triggerElement: null,
				triggerHook: "onCenter",
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
			_scrollOffset = {start: 0, end: 0}, // reflects the parent's scroll position for the start and end of the scene respectively
			_triggerPos = 0,
			_enabled = true,
			_durationUpdateMethod,
			_parent,
			_tween,
			_pin,
			_pinOptions,
			_cssClasses,
			_cssClassElm;

		// object containing validator functions for various options
		var _validate = {
			"unknownOptionSupplied" : function () {
					$.each(_options, function (key, value) {
					if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
						log(2, "WARNING: Unknown option \"" + key + "\"");
						delete _options[key];
					}
				});
			},
			"duration" : function () {
				if ($.isFunction(_options.duration)) {
					_durationUpdateMethod = _options.duration;
					try {
						_options.duration = parseFloat(_durationUpdateMethod());
					} catch (e) {
						log(1, "ERROR: Invalid return value of supplied function for option \"duration\":", _options.duration);
						_durationUpdateMethod = undefined;
						_options.duration = DEFAULT_OPTIONS.duration;
					}
				} else {
					_options.duration = parseFloat(_options.duration);
					if (!$.isNumeric(_options.duration) || _options.duration < 0) {
						log(1, "ERROR: Invalid value for option \"duration\":", _options.duration);
						_options.duration = DEFAULT_OPTIONS.duration;
					}
				}
			},
			"offset" : function () {
				_options.offset = parseFloat(_options.offset);
				if (!$.isNumeric(_options.offset)) {
					log(1, "ERROR: Invalid value for option \"offset\":", _options.offset);
					_options.offset = DEFAULT_OPTIONS.offset;
				}
			},
			"triggerElement" : function () {
				if (_options.triggerElement !== null && $(_options.triggerElement).length === 0) {
					log(1, "ERROR: Element defined in option \"triggerElement\" was not found:", _options.triggerElement);
					_options.triggerElement = DEFAULT_OPTIONS.triggerElement;
				}
			},
			"triggerHook" : function () {
				if (!(_options.triggerHook in TRIGGER_HOOK_VALUES)) {
					if ($.isNumeric(_options.triggerHook)) {
						_options.triggerHook = Math.max(0, Math.min(parseFloat(_options.triggerHook), 1)); //  make sure its betweeen 0 and 1
					} else {
						log(1, "ERROR: Invalid value for option \"triggerHook\": ", _options.triggerHook);
						_options.triggerHook = DEFAULT_OPTIONS.triggerHook;
					}
				}
			},
			"reverse" : function () {
				_options.reverse = !!_options.reverse; // force boolean
			},
			"tweenChanges" : function () {
				_options.tweenChanges = !!_options.tweenChanges; // force boolean
			},
			// (BUILD) - REMOVE IN MINIFY - START
			"loglevel" : function () {
				_options.loglevel = parseInt(_options.loglevel);
				if (!$.isNumeric(_options.loglevel) || _options.loglevel < 0 || _options.loglevel > 3) {
					var wrongval = _options.loglevel;
					_options.loglevel = DEFAULT_OPTIONS.loglevel;
					log(1, "ERROR: Invalid value for option \"loglevel\":", wrongval);
				}
			},
			// (BUILD) - REMOVE IN MINIFY - END
		};

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
			validateOption();

			// event listeners
			ScrollScene
				.on("change.internal", function (e) {
					if (e.what !== "loglevel" && e.what !== "tweenChanges") { // no need for a scene update scene with these options...
						if (e.what === "triggerElement") {
							updateTriggerElementPosition();
						} else if (e.what === "reverse") { // the only property left that may have an impact on the current scene state. Everything else is handled by the shift event.
							ScrollScene.update();
						}
					}
				})
				.on("shift.internal", function (e) {
					updateScrollOffset();
					ScrollScene.update(); // update scene to reflect new position
					if ((_state === "AFTER" && e.reason === "duration") || (_state === 'DURING' && _options.duration === 0)) {
						// if [duration changed after a scene (inside scene progress updates pin position)] or [duration is 0, we are in pin phase and some other value changed].
						updatePinState();
					}
				})
				.on("progress.internal", function (e) {
					updateTweenProgress();
					updatePinState();
				})
				.on("destroy", function (e) {
					e.preventDefault(); // otherwise jQuery would call target.destroy() by default.
				});
		};
		
		// (BUILD) - REMOVE IN MINIFY - START
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
					prefix = "(" + NAMESPACE + ") ->",
					args = Array.prototype.splice.call(arguments, 1);
				args.unshift(loglevel, prefix);
				debug.apply(window, args);
			}
		};
		// (BUILD) - REMOVE IN MINIFY - END

		/**
		 * Checks the validity of a specific or all options and reset to default if neccessary.
		 * @private
		 */
		var validateOption = function (check) {
			if (!arguments.length) {
				check = [];
				for (var key in _validate){
					check.push(key);
				}
			} else if (!$.isArray(check)) {
				check = [check];
			}
			$.each(check, function (key, value) {
				if (_validate[value]) {
					_validate[value]();
				}
			});
		};

		/**
		 * Helper used by the setter/getters for scene options
		 * @private
		 */
		var changeOption = function(varname, newval) {
			var
				changed = false,
				oldval = _options[varname];
			if (_options[varname] != newval) {
				_options[varname] = newval;
				validateOption(varname); // resets to default if necessary
				changed = oldval != _options[varname];
			}
			return changed;
		};

		/**
		 * Update the start and end scrollOffset of the container.
		 * The positions reflect what the parent's scroll position will be at the start and end respectively.
		 * Is called, when:
		 *   - ScrollScene event "change" is called with: offset, triggerHook, duration 
		 *   - scroll container event "resize" is called
		 *   - the position of the triggerElement changes
		 *   - the parent changes -> addTo()
		 * @private
		 */
		var updateScrollOffset = function () {
			_scrollOffset = {start: _triggerPos + _options.offset};
			if (_parent && _options.triggerElement) {
				// take away triggerHook portion to get relative to top
				_scrollOffset.start -= _parent.info("size") * ScrollScene.triggerHook();
			}
			_scrollOffset.end = _scrollOffset.start + _options.duration;
		};

		/**
		 * Updates the duration if set to a dynamic function.
		 * This method is called when the scene is added to a controller and in regular intervals from the controller through scene.refresh().
		 * 
		 * @fires {@link ScrollScene.change}, if the duration changed
		 * @fires {@link ScrollScene.shift}, if the duration changed
		 *
		 * @param {boolean} [suppressEvents=false] - If true the shift event will be suppressed.
		 * @private
		 */
		var updateDuration = function (suppressEvents) {
			// update duration
			if (_durationUpdateMethod) {
				var varname = "duration";
				if (changeOption(varname, _durationUpdateMethod.call(ScrollScene)) && !suppressEvents) { // set
					ScrollScene.trigger("change", {what: varname, newval: _options[varname]});
					ScrollScene.trigger("shift", {reason: varname});
				}
			}
		};

		/**
		 * Updates the position of the triggerElement, if present.
		 * This method is called ...
		 *  - ... when the triggerElement is changed
		 *  - ... when the scene is added to a (new) controller
		 *  - ... in regular intervals from the controller through scene.refresh().
		 * 
		 * @fires {@link ScrollScene.shift}, if the position changed
		 *
		 * @param {boolean} [suppressEvents=false] - If true the shift event will be suppressed.
		 * @private
		 */
		var updateTriggerElementPosition = function (suppressEvents) {
			var elementPos = 0;
			if (_parent && _options.triggerElement) {
				var
					element = $(_options.triggerElement).first(),
					controllerInfo = _parent.info(),
					containerOffset = getOffset(controllerInfo.container), // container position is needed because element offset is returned in relation to document, not in relation to container.
					param = controllerInfo.vertical ? "top" : "left"; // which param is of interest ?
					
				// if parent is spacer, use spacer position instead so correct start position is returned for pinned elements.
				while (element.parent().data("ScrollMagicPinSpacer")) {
					element = element.parent();
				}

				var elementOffset = getOffset(element);

				if (!controllerInfo.isDocument) { // container is not the document root, so substract scroll Position to get correct trigger element position relative to scrollcontent
					containerOffset[param] -= _parent.scrollPos();
				}

				elementPos = elementOffset[param] - containerOffset[param];
			}
			var changed = elementPos != _triggerPos;
			_triggerPos = elementPos;
			if (changed && !suppressEvents) {
				ScrollScene.trigger("shift", {reason: "triggerElementPosition"});
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
			if (_tween) {
				var progress = (to >= 0 && to <= 1) ? to : _progress;
				if (_tween.repeat() === -1) {
					// infinite loop, so not in relation to progress
					if (_state === "DURING" && _tween.paused()) {
						_tween.play();
					} else if (_state !== "DURING" && !_tween.paused()) {
						_tween.pause();
					} else {
						return false;
					}
				} else if (progress != _tween.progress()) { // do we even need to update the progress?
					// no infinite loop - so should we just play or go to a specific point in time?
					if (_options.duration === 0) {
						// play the animation
						if (_state === "DURING") { // play from 0 to 1
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
		var updatePinState = function (forceUnpin) {
			if (_pin && _parent) {
				var 
					containerInfo = _parent.info();

				if (!forceUnpin && _state === "DURING") { // during scene or if duration is 0 and we are past the trigger
					// pinned state
					if (_pin.css("position") != "fixed") {
						// change state before updating pin spacer (position changes due to fixed collapsing might occur.)
						_pin.css("position", "fixed");
						// update pin spacer
						updatePinSpacerSize();
						// add pinned class
						_pin.addClass(_pinOptions.pinnedClass);
					}

					var
						fixedPos = getOffset(_pinOptions.spacer, true), // get viewport position of spacer
 						scrollDistance = _options.reverse || _options.duration === 0 ?
 										 	 containerInfo.scrollPos - _scrollOffset.start // quicker
 										 : Math.round(_progress * _options.duration * 10)/10; // if no reverse and during pin the position needs to be recalculated using the progress
 					
 					// remove spacer margin to get real position (in case marginCollapse mode)
 					fixedPos.top -= parseFloat(_pinOptions.spacer.css("margin-top"));

 					// add scrollDistance
 					fixedPos[containerInfo.vertical ? "top" : "left"] += scrollDistance;

					// set new values
					_pin.css({
						top: fixedPos.top,
						left: fixedPos.left
					});
				} else {
					// unpinned state
					var
						newCSS = {
							position: _pinOptions.inFlow ? "relative" : "absolute",
							top:  0,
							left: 0
						},
						change = _pin.css("position") != newCSS.position;
					
					if (!_pinOptions.pushFollowers) {
						newCSS[containerInfo.vertical ? "top" : "left"] = _options.duration * _progress;
					} else if (_options.duration > 0) { // only concerns scenes with duration
						if (_state === "AFTER" && parseFloat(_pinOptions.spacer.css("padding-top")) === 0) {
							change = true; // if in after state but havent updated spacer yet (jumped past pin)
						} else if (_state === "BEFORE" && parseFloat(_pinOptions.spacer.css("padding-bottom")) === 0) { // before
							change = true; // jumped past fixed state upward direction
						}
					}
					// set new values
					_pin.css(newCSS);
					if (change) {
						// remove pinned class
						_pin.removeClass(_pinOptions.pinnedClass);
						// update pin spacer if state changed
						updatePinSpacerSize();
					}
				}
			}
		};

		/**
		 * Update the pin spacer size.
		 * The size of the spacer needs to be updated whenever the duration of the scene changes, if it is to push down following elements.
		 * @private
		 */
		var updatePinSpacerSize = function () {
			if (_pin && _parent && _pinOptions.inFlow) { // no spacerresize, if original position is absolute
				var
					after = (_state === "AFTER"),
					before = (_state === "BEFORE"),
					during = (_state === "DURING"),
					pinned = (_pin.css("position") == "fixed"),
					vertical = _parent.info("vertical"),
					$spacercontent = _pinOptions.spacer.children().first(), // usually the pined element but can also be another spacer (cascaded pins)
					marginCollapse = isMarginCollapseType(_pinOptions.spacer.css("display")),
					css = {};

				if (marginCollapse) {
					css["margin-top"] = before || (during && pinned) ? _pin.css("margin-top") : "auto";
					css["margin-bottom"] = after || (during && pinned) ? _pin.css("margin-bottom") : "auto";
				} else {
					css["margin-top"] = css["margin-bottom"] = "auto";
				}

				// set new size
				// if relsize: spacer -> pin | else: pin -> spacer
				if (_pinOptions.relSize.width || _pinOptions.relSize.autoFullWidth) {
					if (pinned) {
						if ($(window).width() == _pinOptions.spacer.parent().width()) {
							// relative to body
							_pin.css("width", _pinOptions.relSize.autoFullWidth ? "100%" : "inherit");
						} else {
							// not relative to body -> need to calculate
							_pin.css("width", _pinOptions.spacer.width());
						}
					} else {
						_pin.css("width", "100%");
					}
				} else {
					// minwidth is needed for cascading pins.
					// margin is only included if it's a cascaded pin to resolve an IE9 bug
					css["min-width"] = $spacercontent.outerWidth(!$spacercontent.is(_pin));
					css.width = pinned ? css["min-width"] : "auto";
				}
				if (_pinOptions.relSize.height) {
					if (pinned) {
						if ($(window).height() == _pinOptions.spacer.parent().height()) {
							// relative to body
							_pin.css("height", "inherit");
						} else {
							// not relative to body -> need to calculate
							_pin.css("height", _pinOptions.spacer.height());
						}
					} else {
						_pin.css("height", "100%");
					}
				} else {
					css["min-height"] = $spacercontent.outerHeight(!marginCollapse); // needed for cascading pins
					css.height = pinned ? css["min-height"] : "auto";
				}

				// add space for duration if pushFollowers is true
				if (_pinOptions.pushFollowers) {
					css["padding" + (vertical ? "Top" : "Left")] = _options.duration * _progress;
					css["padding" + (vertical ? "Bottom" : "Right")] = _options.duration * (1 - _progress);
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
			if (_parent && _pin && _state === "DURING" && !_parent.info("isDocument")) {
				updatePinState();
			}
		};

		/**
		 * Updates the Pin spacer size state (in certain scenarios)
		 * If container is resized during pin and relatively sized the size of the pin might need to be updated...
		 * So this function is called on resize of the container.
		 * @private
		 */
		var updateRelativePinSpacer = function () {
			if ( _parent && _pin && // well, duh
					_state === "DURING" && // element in pinned state?
					( // is width or height relatively sized, but not in relation to body? then we need to recalc.
						((_pinOptions.relSize.width || _pinOptions.relSize.autoFullWidth) && $(window).width() != _pinOptions.spacer.parent().width()) ||
						(_pinOptions.relSize.height && $(window).height() != _pinOptions.spacer.parent().height())
					)
			) {
				updatePinSpacerSize();
			}
		};

		/**
		 * Is called, when the mousewhel is used while over a pinned element inside a div container.
		 * If the scene is in fixed state scroll events would be counted towards the body. This forwards the event to the scroll container.
		 * @private
		 */
		var onMousewheelOverPin = function (e) {
			if (_parent && _pin && _state === "DURING" && !_parent.info("isDocument")) { // in pin state
				e.preventDefault();
				_parent.scrollTo(_parent.info("scrollPos") - (e.originalEvent.wheelDelta/3 || -e.originalEvent.detail*30));
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
		 * As a setter it also accepts a function returning a numeric value.  
		 * This is particularly useful for responsive setups.
		 *
		 * The duration is updated using the supplied function every time `ScrollScene.refresh()` is called, which happens periodically from the controller (see ScrollMagic option `refreshInterval`).  
		 * _**NOTE:** Be aware that it's an easy way to kill performance, if you supply a function that has high CPU demand.  
		 * Even for size and position calculations it is recommended to use a variable to cache the value. (see example)  
		 * This counts double if you use the same function for multiple scenes._
		 *
		 * @public
		 * @example
		 * // get the current duration value
		 * var duration = scene.duration();
		 *
	 	 * // set a new duration
		 * scene.duration(300);
		 *
		 * // use a function to automatically adjust the duration to the window height.
		 * var durationValueCache;
		 * function getDuration () {
		 *   return durationValueCache;
		 * }
		 * function updateDuration (e) {
		 *   durationValueCache = $(window).innerHeight();
		 * }
		 * $(window).on("resize", updateDuration); // update the duration when the window size changes
		 * $(window).triggerHandler("resize"); // set to initial value
		 * scene.duration(getDuration); // supply duration method
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @fires {@link ScrollScene.shift}, when used as setter
		 * @param {(number|function)} [newDuration] - The new duration of the scene.
		 * @returns {number} `get` -  Current scene duration.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.duration = function (newDuration) {
			var varname = "duration";
			if (!arguments.length) { // get
				return _options[varname];
			} else {
				if (!$.isFunction(newDuration)) {
					_durationUpdateMethod = undefined;
				}
				if (changeOption(varname, newDuration)) { // set
					ScrollScene.trigger("change", {what: varname, newval: _options[varname]});
					ScrollScene.trigger("shift", {reason: varname});
				}
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
		 * @fires {@link ScrollScene.shift}, when used as setter
		 * @param {number} [newOffset] - The new offset of the scene.
		 * @returns {number} `get` -  Current scene offset.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.offset = function (newOffset) {
			var varname = "offset";
			if (!arguments.length) { // get
				return _options[varname];
			} else if (changeOption(varname, newOffset)) { // set
				ScrollScene.trigger("change", {what: varname, newval: _options[varname]});
				ScrollScene.trigger("shift", {reason: varname});
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the triggerElement option value.
		 * Does **not** fire `ScrollScene.shift`, because changing the trigger Element doesn't necessarily mean the start position changes. This will be determined in `ScrollScene.refresh()`, which is automatically triggered.
		 * @public
		 * @example
		 * // get the current triggerElement
		 * var triggerElement = scene.triggerElement();
		 *
	 	 * // set a new triggerElement using a selector
		 * scene.triggerElement("#trigger");
	 	 * // set a new triggerElement using a jQuery Object
		 * scene.triggerElement($("#trigger"));
	 	 * // set a new triggerElement using a DOM object
		 * scene.triggerElement(document.getElementById("trigger"));
		 *
		 * @fires {@link ScrollScene.change}, when used as setter
		 * @param {(string|object)} [newTriggerElement] - The new trigger element for the scene.
		 * @returns {(string|object)} `get` -  Current triggerElement.
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.triggerElement = function (newTriggerElement) {
			var varname = "triggerElement";
			if (!arguments.length) { // get
				return _options[varname];
			} else if (changeOption(varname, newTriggerElement)) { // set
				ScrollScene.trigger("change", {what: varname, newval: _options[varname]});
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
		 * @fires {@link ScrollScene.shift}, when used as setter
		 * @param {(number|string)} [newTriggerHook] - The new triggerHook of the scene. See {@link ScrollScene} parameter description for value options.
		 * @returns {number} `get` -  Current triggerHook (ALWAYS numerical).
		 * @returns {ScrollScene} `set` -  Parent object for chaining.
		 */
		this.triggerHook = function (newTriggerHook) {
			var varname = "triggerHook";
			if (!arguments.length) { // get
				return $.isNumeric(_options[varname]) ? _options[varname] : TRIGGER_HOOK_VALUES[_options[varname]];
			} else if (changeOption(varname, newTriggerHook)) { // set
				ScrollScene.trigger("change", {what: varname, newval: _options[varname]});
				ScrollScene.trigger("shift", {reason: varname});
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
			var varname = "reverse";
			if (!arguments.length) { // get
				return _options[varname];
			} else if (changeOption(varname, newReverse)) { // set
				ScrollScene.trigger("change", {what: varname, newval: _options[varname]});
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
			var varname = "tweenChanges";
			if (!arguments.length) { // get
				return _options[varname];
			} else if (changeOption(varname, newTweenChanges)) { // set
				ScrollScene.trigger("change", {what: varname, newval: _options[varname]});
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
			var varname = "loglevel";
			if (!arguments.length) { // get
				return _options[varname];
			} else if (changeOption(varname, newLoglevel)) { // set
				ScrollScene.trigger("change", {what: varname, newval: _options[varname]});
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
		 * **Get** the trigger position of the scene (including the value of the `offset` option).  
		 * @public
		 * @example
		 * // get the scene's trigger position
		 * var triggerPosition = scene.triggerPosition();
		 *
		 * @returns {number} Start position of the scene. Top position value for vertical and left position value for horizontal scrolls.
		 */
		this.triggerPosition = function () {
			var pos = _options.offset; // the offset is the basis
			if (_parent) {
				// get the trigger position
				if (_options.triggerElement) {
					// Element as trigger
					pos += _triggerPos;
				} else {
					// return the height of the triggerHook to start at the beginning
					pos += _parent.info("size") * ScrollScene.triggerHook();
				}
			}
			return pos;
		};

		/**
		 * **Get** the trigger offset of the scene (including the value of the `offset` option).  
		 * @public
		 * @deprecated Method is deprecated since 1.1.0. You should now use {@link ScrollScene.triggerPosition}
		 */
		this.triggerOffset = function () {
			return ScrollScene.triggerPosition();
		};

		/**
		 * **Get** the current scroll offset for the start of the scene.  
		 * Mind, that the scrollOffset is related to the size of the container, if `triggerHook` is bigger than `0` (or `"onLeave"`).  
		 * This means, that resizing the container or changing the `triggerHook` will influence the scene's start offset.
		 * @public
		 * @example
		 * // get the current scroll offset for the start and end of the scene.
		 * var start = scene.scrollOffset();
		 * var end = scene.scrollOffset() + scene.duration();
		 * console.log("the scene starts at", start, "and ends at", end);
		 *
		 * @returns {number} The scroll offset (of the container) at which the scene will trigger. Y value for vertical and X value for horizontal scrolls.
		 */
		this.scrollOffset = function () {
			return _scrollOffset.start;
		};

		/*
		 * ----------------------------------------------------------------
		 * public functions (scene modification)
		 * ----------------------------------------------------------------
		 */

		/**
		 * Updates the Scene in the parent Controller to reflect the current state.  
		 * This is the equivalent to `ScrollMagic.updateScene(scene, immediately)`.  
		 * The update method calculates the scene's start and end position (based on the trigger element, trigger hook, duration and offset) and checks it against the current scroll position of the container.  
		 * It then updates the current scene state accordingly (or does nothing, if the state is already correct) – Pins will be set to their correct position and tweens will be updated to their correct progress.
		 * This means an update doesn't necessarily result in a progress change. The `progress` event will be fired if the progress has indeed changed between this update and the last.  
		 * _**NOTE:** This method gets called constantly whenever ScrollMagic detects a change. The only application for you is if you change something outside of the realm of ScrollMagic, like moving the trigger or changing tween parameters._
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
		 * @param {boolean} [immediately=false] - If `true` the update will be instant, if `false` it will wait until next update cycle (better performance).
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.update = function (immediately) {
			if (_parent) {
				if (immediately) {
					if (_parent.enabled() && _enabled) {
						var
							scrollPos = _parent.info("scrollPos"),
							newProgress;

						if (_options.duration > 0) {
							newProgress = (scrollPos - _scrollOffset.start)/(_scrollOffset.end - _scrollOffset.start);
						} else {
							newProgress = scrollPos >= _scrollOffset.start ? 1 : 0;
						}

						ScrollScene.trigger("update", {startPos: _scrollOffset.start, endPos: _scrollOffset.end, scrollPos: scrollPos});

						ScrollScene.progress(newProgress);
					} else if (_pin && _state === "DURING") {
						updatePinState(true); // unpin in position
					}
				} else {
					_parent.updateScene(ScrollScene, false);
				}
			}
			return ScrollScene;
		};

		/**
		 * Updates dynamic scene variables like the trigger element position or the duration.
		 * This method is automatically called in regular intervals from the controller. See {@link ScrollMagic} option `refreshInterval`.
		 * 
		 * You can call it to minimize lag, for example when you intentionally change the position of the triggerElement.
		 * If you don't it will simply be updated in the next refresh interval of the container, which is usually sufficient.
		 *
		 * @public
		 * @since 1.1.0
		 * @example
		 * scene = new ScrollScene({triggerElement: "#trigger"});
		 * 
		 * // change the position of the trigger
		 * $("#trigger").css("top", 500);
		 * // immediately let the scene know of this change
		 * scene.refresh();
		 *
		 * @fires {@link ScrollScene.shift}, if the trigger element position or the duration changed
		 * @fires {@link ScrollScene.change}, if the duration changed
		 *
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.refresh = function () {
			updateDuration();
			updateTriggerElementPosition();
			// update trigger element position
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the scene's progress.  
		 * Usually it shouldn't be necessary to use this as a setter, as it is set automatically by scene.update().  
		 * The order in which the events are fired depends on the duration of the scene:
		 *  1. Scenes with `duration == 0`:  
		 *  Scenes that have no duration by definition have no ending. Thus the `end` event will never be fired.  
		 *  When the trigger position of the scene is passed the events are always fired in this order:  
		 *  `enter`, `start`, `progress` when scrolling forward  
		 *  and  
		 *  `progress`, `start`, `leave` when scrolling in reverse
		 *  2. Scenes with `duration > 0`:  
		 *  Scenes with a set duration have a defined start and end point.  
		 *  When scrolling past the start position of the scene it will fire these events in this order:  
		 *  `enter`, `start`, `progress`  
		 *  When continuing to scroll and passing the end point it will fire these events:  
		 *  `progress`, `end`, `leave`  
		 *  When reversing through the end point these events are fired:  
		 *  `enter`, `end`, `progress`  
		 *  And when continuing to scroll past the start position in reverse it will fire:  
		 *  `progress`, `start`, `leave`  
		 *  In between start and end the `progress` event will be called constantly, whenever the progress changes.
		 * 
		 * In short:  
		 * `enter` events will always trigger **before** the progress update and `leave` envents will trigger **after** the progress update.  
		 * `start` and `end` will always trigger at their respective position.
		 * 
		 * Please review the event descriptions for details on the events and the event object that is passed to the callback.
		 * 
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
					scrollDirection = _parent ? _parent.info("scrollDirection") : 'PAUSED',
					reverseOrForward = _options.reverse || progress >= _progress;
				if (_options.duration === 0) {
					// zero duration scenes
					doUpdate = _progress != progress;
					_progress = progress < 1 && reverseOrForward ? 0 : 1;
					_state = _progress === 0 ? 'BEFORE' : 'DURING';
				} else {
					// scenes with start and end
					if (progress <= 0 && _state !== 'BEFORE' && reverseOrForward) {
						// go back to initial state
						_progress = 0;
						_state = 'BEFORE';
						doUpdate = true;
					} else if (progress > 0 && progress < 1 && reverseOrForward) {
						_progress = progress;
						_state = 'DURING';
						doUpdate = true;
					} else if (progress >= 1 && _state !== 'AFTER') {
						_progress = 1;
						_state = 'AFTER';
						doUpdate = true;
					} else if (_state === 'DURING' && !reverseOrForward) {
						updatePinState(); // in case we scrolled backwards mid-scene and reverse is disabled => update the pin position, so it doesn't move back as well.
					}
				}
				if (doUpdate) {
					// fire events
					var
						eventVars = {progress: _progress, state: _state, scrollDirection: scrollDirection},
						stateChanged = _state != oldState;

					var trigger = function (eventName) { // tmp helper to simplify code
						ScrollScene.trigger(eventName, eventVars);
					};

					if (stateChanged) { // enter events
						if (oldState !== 'DURING') {
							trigger("enter");
							trigger(oldState === 'BEFORE' ? "start" : "end");
						}
					}
					trigger("progress");
					if (stateChanged) { // leave events
						if (_state !== 'DURING') {
							trigger(_state === 'BEFORE' ? "start" : "end");
							trigger("leave");
						}
					}
				}

				return ScrollScene;
			}
		};

		/**
		 * Add a tween to the scene.  
		 * If you want to add multiple tweens, wrap them into one TimelineMax object and add it.  
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
		 * @param {object} TweenObject - A TweenMax, TweenLite, TimelineMax or TimelineLite object that should be animated in the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.setTween = function (TweenObject) {
			if (!TimelineMax) {
				log(1, "ERROR: TimelineMax wasn't found. Please make sure GSAP is loaded before ScrollMagic or use asynchronous loading.");
				return ScrollScene;
			}
			if (_tween) { // kill old tween?
				ScrollScene.removeTween();
			}
			try {
				// wrap Tween into a TimelineMax Object to include delay and repeats in the duration and standardize methods.
				_tween = new TimelineMax({smoothChildTiming: true})
					.add(TweenObject)
					.pause();
			} catch (e) {
				log(1, "ERROR calling method 'setTween()': Supplied argument is not a valid TweenObject");
			} finally {
				// some properties need to be transferred it to the wrapper, otherwise they would get lost.
				if (TweenObject.repeat && TweenObject.repeat() === -1) {// TweenMax or TimelineMax Object?
					_tween.repeat(-1);
					_tween.yoyo(TweenObject.yoyo());
				}
			}
			// (BUILD) - REMOVE IN MINIFY - START
			// Some tween validations and debugging helpers

			// check if there are position tweens defined for the trigger and warn about it :)
			if (_tween && _parent  && _options.triggerElement && _options.loglevel >= 2) {// parent is needed to know scroll direction.
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

			// warn about tween overwrites, when an element is tweened multiple times
			if (parseFloat(TweenLite.version) >= 1.14) { // onOverwrite only present since GSAP v1.14.0
				var
					list = _tween.getChildren(true, true, false), // get all nested tween objects
					newCallback = function () {
						log(2, "WARNING: tween was overwritten by another. To learn how to avoid this issue see here: https://github.com/janpaepke/ScrollMagic/wiki/WARNING:-tween-was-overwritten-by-another");
					};
				for (var i=0, thisTween, oldCallback; i<list.length; i++) {
					/*jshint loopfunc: true */
					thisTween = list[i];
					if (oldCallback !== newCallback) { // if tweens is added more than once
						oldCallback = thisTween.vars.onOverwrite;
						thisTween.vars.onOverwrite = function () {
							if (oldCallback) {
								oldCallback.apply(this, arguments);
							}
							newCallback.apply(this, arguments);
						};
					}
				}
			}
			// (BUILD) - REMOVE IN MINIFY - END
			log(3, "added tween");
			updateTweenProgress();
			return ScrollScene;
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
		 * Pin an element for the duration of the tween.  
		 * If the scene duration is 0 the element will only be unpinned, if the user scrolls back past the start position.  
		 * _**NOTE:** The option `pushFollowers` has no effect, when the scene duration is 0._
		 * @public
		 * @example
		 * // pin element and push all following elements down by the amount of the pin duration.
		 * scene.setPin("#pin");
		 *
		 * // pin element and keeping all following elements in their place. The pinned element will move past them.
		 * scene.setPin("#pin", {pushFollowers: false});
		 *
		 * @param {(string|object)} element - A Selector targeting an element, a DOM object or a jQuery object that is supposed to be pinned.
		 * @param {object} [settings] - settings for the pin
		 * @param {boolean} [settings.pushFollowers=true] - If `true` following elements will be "pushed" down for the duration of the pin, if `false` the pinned element will just scroll past them.  
		 												   Ignored, when duration is `0`.
		 * @param {string} [settings.spacerClass="scrollmagic-pin-spacer"] - Classname of the pin spacer element, which is used to replace the element.  
		 * @param {string} [settings.pinnedClass=""] - Classname that should be added to the pinned element during pin phase (and removed after).
		 *
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.setPin = function (element, settings) {
			var
				defaultSettings = {
					pushFollowers: true,
					spacerClass: "scrollmagic-pin-spacer",
					pinnedClass: ""
				};
			settings = $.extend({}, defaultSettings, settings);

			// validate Element
			element = $(element).first();
			if (element.length === 0) {
				log(1, "ERROR calling method 'setPin()': Invalid pin element supplied.");
				return ScrollScene; // cancel
			} else if (element.css("position") == "fixed") {
				log(1, "ERROR calling method 'setPin()': Pin does not work with elements that are positioned 'fixed'.");
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
			
			_pin.parent().hide(); // hack start to force jQuery css to return stylesheet values instead of calculated px values.
			var
				inFlow = _pin.css("position") != "absolute",
				pinCSS = _pin.css(["display", "top", "left", "bottom", "right"]),
				sizeCSS = _pin.css(["width", "height"]);
			_pin.parent().show(); // hack end.

			if (sizeCSS.width === "0px" &&  inFlow && isMarginCollapseType(pinCSS.display)) {
				// log (2, "WARNING: Your pinned element probably needs a defined width or it might collapse during pin.");
			}
			if (!inFlow && settings.pushFollowers) {
				log(2, "WARNING: If the pinned element is positioned absolutely pushFollowers is disabled.");
				settings.pushFollowers = false;
			}

			// create spacer
			var spacer = $("<div></div>")
					.addClass(settings.spacerClass)
					.css(pinCSS)
					.data("ScrollMagicPinSpacer", true)
					.css({
						position: inFlow ? "relative" : "absolute",
						"margin-left": "auto",
						"margin-right": "auto",
						"box-sizing": "content-box"
					});

			// set the pin Options
			var pinInlineCSS = _pin[0].style;
			_pinOptions = {
				spacer: spacer,
				relSize: { // save if size is defined using % values. if so, handle spacer resize differently...
					width: sizeCSS.width.slice(-1) === "%",
					height: sizeCSS.height.slice(-1) === "%",
					autoFullWidth: sizeCSS.width === "0px" &&  inFlow && isMarginCollapseType(pinCSS.display)
				},
				pushFollowers: settings.pushFollowers,
				inFlow: inFlow, // stores if the element takes up space in the document flow
				origStyle: {
					width: pinInlineCSS.width || "",
					position: pinInlineCSS.position || "",
					top: pinInlineCSS.top || "",
					left: pinInlineCSS.left || "",
					bottom: pinInlineCSS.bottom || "",
					right: pinInlineCSS.right || "",
					"box-sizing": pinInlineCSS["box-sizing"] || "",
					"-moz-box-sizing": pinInlineCSS["-moz-box-sizing"] || "",
					"-webkit-box-sizing": pinInlineCSS["-webkit-box-sizing"] || ""
				}, // save old styles (for reset)
				pinnedClass: settings.pinnedClass // the class that should be added to the element when pinned
			};

			// if relative size, transfer it to spacer and make pin calculate it...
			if (_pinOptions.relSize.width) {
				spacer.css("width", sizeCSS.width);
			}
			if (_pinOptions.relSize.height) {
				spacer.css("height", sizeCSS.height);
			}

			// now place the pin element inside the spacer	
			_pin.before(spacer)
					.appendTo(spacer)
					// and set new css
					.css({
						position: inFlow ? "relative" : "absolute",
						top: "auto",
						left: "auto",
						bottom: "auto",
						right: "auto"
					});
			
			if (_pinOptions.relSize.width || _pinOptions.relSize.autoFullWidth) {
				_pin.css("box-sizing", "border-box");
			}

			// add listener to document to update pin position in case controller is not the document.
			$(window).on("scroll." + NAMESPACE + "_pin resize." + NAMESPACE + "_pin", updatePinInContainer);
			// add mousewheel listener to catch scrolls over fixed elements
			_pin.on("mousewheel DOMMouseScroll", onMousewheelOverPin);

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
					if (_state === "DURING") {
						updatePinState(true); // force unpin at position
					}
				}
				$(window).off("scroll." + NAMESPACE + "_pin resize." + NAMESPACE + "_pin");
				_pin.off("mousewheel DOMMouseScroll", onMousewheelOverPin);
				_pin = undefined;
				log(3, "removed pin (reset: " + (reset ? "true" : "false") + ")");
			}
			return ScrollScene;
		};

		/**
		 * Define a css class modification while the scene is active.  
		 * When the scene triggers the classes will be added to the supplied element and removed, when the scene is over.
		 * If the scene duration is 0 the classes will only be removed if the user scrolls back past the start position.
		 * @public
		 * @example
		 * // add the class 'myclass' to the element with the id 'my-elem' for the duration of the scene
		 * scene.setClassToggle("#my-elem", "myclass");
		 *
		 * // add multiple classes to multiple elements defined by the selector '.classChange'
		 * scene.setClassToggle(".classChange", "class1 class2 class3");
		 *
		 * @param {(string|object)} element - A Selector targeting one or more elements, a DOM object or a jQuery object that is supposed to be modified.
		 * @param {string} classes - One or more Classnames (separated by space) that should be added to the element during the scene.
		 *
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.setClassToggle = function (element, classes) {
			var $elm = $(element);
			if ($elm.length === 0 || $.type(classes) !== "string") {
				log(1, "ERROR calling method 'setClassToggle()': Invalid " + ($elm.length === 0 ? "element" : "classes") + " supplied.");
				return ScrollScene;
			}
			_cssClasses = classes;
			_cssClassElm = $elm;
			ScrollScene.on("enter.internal_class leave.internal_class", function (e) {
				_cssClassElm.toggleClass(_cssClasses, e.type === "enter");
			});
			return ScrollScene;
		};

		/**
		 * Remove the class binding from the scene.
		 * @public
		 * @example
		 * // remove class binding from the scene without reset
		 * scene.removeClassToggle();
		 *
		 * // remove class binding and remove the changes it caused
		 * scene.removeClassToggle(true);
		 *
		 * @param {boolean} [reset=false] - If `false` and the classes are currently active, they will remain on the element. If `true` they will be removed.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.removeClassToggle = function (reset) {
			if (_cssClassElm && reset) {
				_cssClassElm.removeClass(_cssClasses);
			}
			ScrollScene.off("start.internal_class end.internal_class");
			_cssClasses = undefined;
			_cssClassElm = undefined;
			return ScrollScene;
		};

		/**
		 * Add the scene to a controller.  
		 * This is the equivalent to `ScrollMagic.addScene(scene)`.
		 * @public
		 * @example
		 * // add a scene to a ScrollMagic controller
		 * scene.addTo(controller);
		 *
		 * @param {ScrollMagic} controller - The controller to which the scene should be added.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.addTo = function (controller) {
			if (!(controller instanceof ScrollMagic)) {
				log(1, "ERROR: supplied argument of 'addTo()' is not a valid ScrollMagic controller");
			} else if (_parent != controller) {
				// new parent
				if (_parent) { // I had a parent before, so remove it...
					_parent.removeScene(ScrollScene);
				}
				_parent = controller;
				validateOption();
				updateDuration(true);
				updateTriggerElementPosition(true);
				updateScrollOffset();
				updatePinSpacerSize();
				_parent.info("container").on("resize." + NAMESPACE, function () {
					updateRelativePinSpacer();
					if (ScrollScene.triggerHook() > 0) {
						ScrollScene.trigger("shift", {reason: "containerSize"});
					}
				});
				log(3, "added " + NAMESPACE + " to controller");
				controller.addScene(ScrollScene);
				ScrollScene.update();
			}
			return ScrollScene;
		};

		/**
		 * **Get** or **Set** the current enabled state of the scene.  
		 * This can be used to disable this scene without removing or destroying it.
		 * @public
		 *
		 * @example
		 * // get the current value
		 * var enabled = scene.enabled();
		 *
	 	 * // disable the scene
		 * scene.enabled(false);
		 *
		 * @param {boolean} [newState] - The new enabled state of the scene `true` or `false`.
		 * @returns {(boolean|ScrollScene)} Current enabled state or parent object for chaining.
		 */
		this.enabled = function (newState) {
			if (!arguments.length) { // get
				return _enabled;
			} else if (_enabled != newState) { // set
				_enabled = !!newState;
				ScrollScene.update(true);
			}
			return ScrollScene;
		};
		
		/**
		 * Remove the scene from its parent controller.  
		 * This is the equivalent to `ScrollMagic.removeScene(scene)`.
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
				_parent.info("container").off("resize." + NAMESPACE);
				var tmpParent = _parent;
				_parent = undefined;
				log(3, "removed " + NAMESPACE + " from controller");
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
			ScrollScene.removeTween(reset);
			ScrollScene.removePin(reset);
			ScrollScene.removeClassToggle(reset);
			ScrollScene.trigger("destroy", {reset: reset});
			ScrollScene.remove();
			ScrollScene.off("start end enter leave progress change update shift destroy shift.internal change.internal progress.internal");
			log(3, "destroyed " + NAMESPACE + " (reset: " + (reset ? "true" : "false") + ")");
			return null;
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
		 * For details on this event and the order in which it is fired, please review the {@link ScrollScene.progress} method.
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
		 * Scene end event.  
		 * Fires whenever the scroll position its the ending point of the scene.  
		 * It will also fire when scrolling back up from after the scene and going over its end position. If you want something to happen only when scrolling down/right, use the scrollDirection parameter passed to the callback.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link ScrollScene.progress} method.
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
		 * Scene enter event.  
		 * Fires whenever the scene enters the "DURING" state.  
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene enters its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link ScrollScene.progress} method.
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
		 * Scene leave event.  
		 * Fires whenever the scene's state goes from "DURING" to either "BEFORE" or "AFTER".  
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene leaves its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link ScrollScene.progress} method.
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
		 * Scene update event.  
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
		 * Scene progress event.  
		 * Fires whenever the progress of the scene changes.
		 *
		 * For details on this event and the order in which it is fired, please review the {@link ScrollScene.progress} method.
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
		 * Scene change event.  
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
		 * Scene shift event.  
		 * Fires whenvever the start or end **scroll offset** of the scene change.
		 * This happens explicitely, when one of these values change: `offset`, `duration` or `triggerHook`.
		 * It will fire implicitly when the `triggerElement` changes, if the new element has a different position (most cases).
		 * It will also fire implicitly when the size of the container changes and the triggerHook is anything other than `onLeave`.
		 *
		 * @event ScrollScene.shift
		 * @since 1.1.0
		 *
		 * @example
		 * scene.on("shift", function (event) {
		 * 		console.log("Scene moved, because the " + event.reason + " has changed.)");
		 * });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {string} event.reason - Indicates why the scene has shifted
		 */
		/**
		 * Scene destroy event.  
		 * Fires whenvever the scene is destroyed.
		 * This can be used to tidy up custom behaviour used in events.
		 *
		 * @event ScrollScene.destroy
		 * @since 1.1.0
		 *
		 * @example
		 * scene.on("enter", function (event) {
		 *        // add custom action
		 *        $("#my-elem").left("200");
		 *      })
		 *      .on("destroy", function (event) {
		 *        // reset my element to start position
		 *        if (event.reset) {
		 *          $("#my-elem").left("0");
		 *        }
		 *      });
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {boolean} event.reset - Indicates if the destroy method was called with reset `true` or `false`.
		 */
		 
		 /**
		 * Add one ore more event listener.  
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
							.replace(/(\w+)\.(\w+)/g, '$1.' + NAMESPACE + '_$2') // add custom namespace, if one is defined
							.replace(/( |^)(\w+)(?= |$)/g, '$1$2.' + NAMESPACE ); // add namespace to regulars.
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
						.replace(/(\w+)\.(\w+)/g, '$1.' + NAMESPACE + '_$2') // add custom namespace, if one is defined
						.replace(/( |^)(\w+)(?= |$)/g, '$1$2.' + NAMESPACE + '$3'); // add namespace to regulars.
			$(ScrollScene).off(names, callback);
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
			var event = $.Event($.trim(name).toLowerCase(), vars);
			$(ScrollScene).trigger(event);
			return ScrollScene;
		 };

		// INIT
		construct();
		return ScrollScene;
	};