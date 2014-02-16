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

// TODO: make examples
// TODO: finish Docs
// TODO: bug: when making the duration shorter after or during a pin, the element isn't pinned correctly.
// -----------------------
// TODO: improvement: consider call conditions for updatePinSpacerSize (performance?)
// TODO: improvement: only update fixed position when it changed (otherwise some quirks in safari - also: performance...)
// TODO: bug: when cascading pins (pinning one element multiple times) and later removing them without reset positioning errors occur.
// TODO: bug: When scrolling back with a pin and reverse false DURING the scene, the pin isnt'stuck where it is. If it would be unpinned where it is scrolling up would change the fixed position and the start or end position by the ammount scrolled back. For now pins will behave normally in this case and fire no events. Workaround see ScrollSCene.progress, last elseif bracket.
// TODO: feature: have different tweens, when scrolling up, than when scrolling down
// TODO: feature: make pins work with -webkit-transform of parent for mobile applications. Might be possible by temporarily removing the pin element from its container and attaching it to the body during pin. Reverting might be difficult though (cascaded pins).

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
	 * @param {boolean} [options.vertical=true] - Sets the scroll mode to vertical (true) or horizontal (false) scrolling.
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
			_options.scrollContainer = $(_options.scrollContainer).first()
			// check ScrolContainer
			if (_options.scrollContainer.length == 0) {
				log(1, "ERROR creating object ScrollMagic: No valid scroll container supplied");
				return; // cancel
			}
			_isDocument = !$.contains(document, _options.scrollContainer.get(0));
			// update container size immediately
			_viewPortSize = _options.vertical ? _options.scrollContainer.height() : _options.scrollContainer.width();
			// set event handlers
			_options.scrollContainer.on("scroll resize", onChange);
			try {
				TweenLite.ticker.addEventListener("tick", onTick); // prefer TweenMax Ticker, but don't rely on it for basic functionality
				_tickerUsed = true;
			} catch (e) {
				_options.scrollContainer.on("scroll resize", onTick); // okay then just update on scroll/resize...
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
				_updateScenesOnNextTick = false;
			}
		};
		
		/**
		* Handles Container changes
		* @private
		*/
		var onChange = function (e) {
			if (e.type == "resize") {
				_viewPortSize = _options.vertical ? _options.scrollContainer.height() : _options.scrollContainer.width();
			}
			var oldScrollPos = _scrollPos;
			_scrollPos = _options.vertical ? _options.scrollContainer.scrollTop() : _options.scrollContainer.scrollLeft();
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
				log(3, "added Scene (" + _sceneObjects.length + " total)");
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
				log(3, "removed Scene (" + _sceneObjects.length + " total)");
			}
			return ScrollMagic;
		};

		/**
		 * Update a specific scene according to the scroll position of the container.
		 * @public
		 *
		 * @param {ScrollScene} scene - The ScollScene object that is supposed to be updated.
		 * @param {boolean} [immediately=false] - If true the update will be instantly, if false it will wait until next tweenmax tick. This is useful when changing multiple properties of the scene - this way it will only be updated once all new properties are set (onTick).
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
		 * Update the container and all Scenes
		 * @public
		 *
		 * @param {boolean} [immediately=false] - If true the update will be instantly, if false it will wait until next tweenmax tick (better performance);
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
		 * Get all infos or one particular about the controller.
		 * @public
		 *
		 * @param {string} [about] - If passed only this info will be returned instead of an object containing all.
		 * @returns {(mixed|object)} - The requested info(s).
		 */
		this.info = function (about) {
			var values = {
				size: _viewPortSize, // contains height or width (in regard to orientation);
				vertical: _options.vertical,
				scrollPos: _scrollPos,
				scrollDirection: _scrollDirection,
				container: _options.scrollContainer,
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
		 * Get loglevel option value.
		 * @public
		 *
		 * @returns {number}
		 *//**
		 * Set loglevel option value (added for concistency reasons).
		 * @public
		 *
		 * @param {number} newLoglevel - The new loglevel setting of the ScrollMagic controller.
		 * @returns {ScrollMagic} Parent object for chaining.
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
		 * Destroy the Controller all Scenes and everything.
		 * @public
		 *
		 * @param {boolean} [resetScenes=false] - If true the pins and tweens (if existent) of all scenes will be reset.
		 * @returns {null}
		 */
		this.destroy = function (resetScenes) {
			while (_sceneObjects.length > 0) {
				var scene = _sceneObjects[_sceneObjects.length - 1];
				scene.destroy(resetScenes);
			}
			_options.scrollContainer.off("scroll resize", onChange);
			if (_tickerUsed) {
				TweenLite.ticker.removeEventListener("tick", onTick);
			} else {
				_options.scrollContainer.off("scroll resize", onTick);
			}
			log(3, "destroyed ScrollMagic (reset: " + (resetScenes ? "true" : "false") + ")");
			return null;
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
	 * @param {(string|object)} [options.triggerElement=null] - An Element that defines the start of the scene. Can be a Selector (string), a jQuery Object or a HTML Object. If undefined the scene will start right at the beginning (unless an offset is set).
	 * @param {(float|string)} [options.triggerHook="onCenter"] - Can be string "onCenter", "onEnter", "onLeave" or float (0 - 1), 0 = onLeave, 1 = onEnter
	 * @param {boolean} [options.reverse=true] - Should the scene reverse, when scrolling up?
	 * @param {boolean} [options.tweenChanges=false] - Tweens Animation to the progress target instead of setting it. Does not affect animations where duration=0
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
						var TweenProgress = progress * _tween.duration();
						// go to a specific point in time
						if (_options.tweenChanges) {
							// go smooth
							_tween.tweenTo(TweenProgress);
						} else {
							// just hard set it
							_tween.pause(TweenProgress);
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
					css,
					containerInfo = _parent.info();

				if (state === "DURING" || (state === "AFTER" && _options.duration == 0)) { // if duration is 0 - we just never unpin
					// pinned
					var fixedPos = getOffset(_pinOptions.spacer, true); // get viewport position of spacer
 					
 					// add progress
 					fixedPos[containerInfo.vertical ? "top" : "left"] += _options.duration * _progress;

					css = {
						position: "fixed",
						top: fixedPos.top,
						left: fixedPos.left
					};
				} else {
					// unpinned
					css = {
						position: "relative",
						top:  0,
						left: 0
					};
					if (!_pinOptions.pushFollowers && state === "AFTER") {
						css[containerInfo.vertical ? "top" : "left"] = _options.duration * _progress;
					}
				}
				_pin.css(css);
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
		 * Get parent controller.
		 * @public
		 *
		 * @returns {ScrollMagic} Parent controller or undefined
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
				ScrollScene.trigger("change", {what: "duration", newval: newDuration}); // fire event
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
				ScrollScene.trigger("change", {what: "offset", newval: newOffset}); // fire event
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
				ScrollScene.trigger("change", {what: "triggerElement", newval: newTriggerElement}); // fire event
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
				ScrollScene.trigger("change", {what: "triggerHook", newval: newTriggerHook}); // fire event
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
				ScrollScene.trigger("change", {what: "reverse", newval: newReverse}); // fire event
				ScrollScene.update();
			}
			return ScrollScene;
		};

		/**
		 * Get tweenChanges option value.
		 * @public
		 *
		 * @returns {boolean}
		 *//**
		 * Set tweenChanges option value.
		 * @public
		 *
		 * @fires ScrollScene.change
		 * @param {boolean} newTweenChanges - The new tweenChanges setting of the scene.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		this.tweenChanges = function (newTweenChanges) {
			if (!arguments.length) { // get
				return _options.tweenChanges;
			} else if (_options.tweenChanges != newTweenChanges) { // set
				_options.tweenChanges = newTweenChanges;
				checkOptionsValidity();
				ScrollScene.trigger("change", {what: "tweenChanges", newval: newTweenChanges}); // fire event
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
				ScrollScene.trigger("change", {what: "loglevel", newval: newLoglevel}); // fire event
				// no need to update the scene with this param...
			}
			return ScrollScene;
		};
		
		/**
		 * Get the current state.
		 * @public
		 *
		 * @returns {string} "BEFORE", "DURING" or "AFTER"
		 */
		this.state = function () {
			return _state;
		};
		
		/**
		 * Get the trigger offset.
		 * (always numerical, whereas triggerElement can be a jQuery/HTML object or nothing)
		 * @public
		 *
		 * @returns {number} Numeric trigger offset, in relation to scroll direction
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
		 * Update the Scene in the parent Controller
		 * Can also be achieved using controller.update(scene);
		 * @public
		 *
		 * @fires ScrollScene.update
		 *
		 * @param {boolean} [immediately=false] - If true the update will be instantly, if false it will wait until next tweenmax tick (better performance);
		 * @returns {ScrollScene}
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
						newProgress = containerInfo.scrollPos > startPos ? 1 : 0;
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
					_state = 'BEFORE';
					doUpdate = true;
				} else if (progress > 0 && progress < 1 && _progress != progress && (progress >= _progress || _options.reverse)) {
					_progress = progress;
					_state = 'DURING';
					doUpdate = true;
				} else if (progress >= 1 && _state !== 'AFTER') {
					_progress = 1;
					_state = 'AFTER';
					doUpdate = true;
				} else if (_state === "DURING") { // WORKAROUND (see TODOs): only occurs when reverse is false, otherwise it would be cought above.
					updatePinState(progress <= 0 ? "BEFORE" : "DURING"); // do a hard update of the pin
				}
				if (doUpdate) {
					// fire events
					var
						eventVars = {progress: _progress, state: _state, scrollDirection: scrollDirection},
						stateChanged = _state != oldState;

					// do actual updates
					updateTweenProgress();
					if (stateChanged || _state === "DURING") { // update pins only if something changes OR during Pin
						updatePinState();
					}
					ScrollScene.trigger("progress", eventVars);


					if (stateChanged) { // fire state change events
						if (_state === 'DURING' || _options.duration == 0) {
							ScrollScene.trigger("enter", eventVars);
						}
						if ((_state === 'DURING' && scrollDirection === 'FORWARD')|| _state === 'BEFORE') {
							ScrollScene.trigger("start", eventVars);
						} else if (_options.duration == 0) {
							ScrollScene.trigger((_state === 'AFTER') ? "start" : "end", eventVars);
						}
						if ((_state === 'DURING' && scrollDirection === 'REVERSE')|| _state === 'AFTER') {
							ScrollScene.trigger("end", {scrollDirection: scrollDirection});
						} else if (_options.duration == 0) {
							ScrollScene.trigger((_state === 'AFTER') ? "start" : "end", eventVars);
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
				// some propertties need to be transfered it to the wrapper, otherwise they would get lost.
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
				_tween = undefined;
				log(3, "removed tween (reset: " + (reset ? "true" : "false") + ")");
			}
			return ScrollScene;
		};

		/**
		 * Pin an element for the duration of the tween.
		 * @public
		 *
		 * @param {(string|object)} element - A Selctor or a jQuery object for the object that is supposed to be pinned.
		 * @param {object} [settings.pushFollowers=true] - If true following elements will be "pushed" down for the duration of the pin, if false the pinned element will just scroll past them. Ignored, when duration is 0.
		 * @param {object} [settings.spacerClass="scrollmagic-pin-spacer"] - Classname of the pin spacer element
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
		 *
		 * @param {boolean} [reset=false] - If false the spacer will not be removed and the element's position will not be reset.
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
				log(3, "added ScrollScene to controller");
				controller.addScene(ScrollScene);
				ScrollScene.update();
				return ScrollScene;
			}
		};

		/**
		 * Remove the scene from its parent controller.
		 * Can also be achieved using controller.removeScene(scene);
		 * To remove the pin or the tween you need to call removeTween() or removePin() respectively
		 * @public
		 *
		 * @returns {ScrollScene}
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
		 *
		 * @param {boolean} [reset=false] - If true the pin and tween (if existent) will be reset.
		 * @returns {null}
		 */
		this.destroy = function (reset) {
			this.removeTween(reset);
			this.removePin(reset);
			this.remove();
			this.off("start end enter leave progress change update")
			log(3, "destroyed ScrollScene (reset: " + (reset ? "true" : "false") + ")");
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
		 * @event ScrollScene.start
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene "BEFORE", "DURING" or "AFTER"
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling "PAUSED", FORWARD" or "REVERSE"
		 */
		/**
		 * Scene end event.
		 * Fires whenever the scroll position its the ending point of the scene.
		 * It will also fire when scrolling back up from after the scene and going over its end position. If you want something to happen only when scrolling down/right, use the scrollDirection parameter passed to the callback.
		 *
		 * @event ScrollScene.end
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene "BEFORE", "DURING" or "AFTER"
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling "PAUSED", FORWARD" or "REVERSE"
		 */
		/**
		 * Scene enter event.
		 * Fires whenever the scene enters the "DURING" state.
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene enters its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * @event ScrollScene.enter
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene "BEFORE", "DURING" or "AFTER"
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling "PAUSED", FORWARD" or "REVERSE"
		 */
		/**
		 * Scene leave event.
		 * Fires whenever the scene's state goes from "DURING" to either "BEFORE" or "AFTER".
		 * Keep in mind that it doesn't matter if the scene plays forward or backward: This event always fires when the scene leaves its active scroll timeframe, regardless of the scroll-direction.
		 *
		 * @event ScrollScene.leave
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene "BEFORE", "DURING" or "AFTER"
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling "PAUSED", FORWARD" or "REVERSE"
		 */
		/**
		 * Scene update event.
		 * Fires whenever the scene is updated (but not necessarily changes the progress)
		 *
		 * @event ScrollScene.update
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
		 * @event ScrollScene.progress
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {number} event.progress - Reflects the current progress of the scene
		 * @property {string} event.state - The current state of the scene "BEFORE", "DURING" or "AFTER"
		 * @property {string} event.scrollDirection - Indicates which way we are scrolling "PAUSED", FORWARD" or "REVERSE"
		 */
		/**
		 * Scene change event.
		 * Fires whenvever a property of the scene is changed.
		 *
		 * @event ScrollScene.change
		 *
		 * @property {object} event - The event Object passed to each callback
		 * @property {string} event.type - The name of the event
		 * @property {ScrollScene} event.target - The ScrollScene object that triggered this event
		 * @property {string} event.what - Indicates what value has been changed
		 * @property {mixed} event.newval - The new value of the changed property
		 */
		 
		 /**
		 * Add an event listener.
		 * The callback function will be fired at the respective event, and an object containing relevant data will be passed to the callback.
		 * @public
		 *
		 * @param {string} name - The name or names of the event the callback should be attached to.
		 * @param {function} callback - A function that should be executed, when the event is dispatched. An event object will be passed to the callback.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.on = function (name, callback) {
			if ($.isFunction(callback)) {
				var events = $.trim(name).toLowerCase().split(" ");
				$(document).on(events.join(".ScrollScene ") + ".ScrollScene", callback);
			} else {
				log(1, "ERROR calling method 'on()': Supplied argument is not a valid callback!");
			}
			return ScrollScene;
		 };

		 /**
		 * Remove an event listener.
		 * @public
		 *
		 * @param {string} name - The name or names of the event that should be removed.
		 * @param {function} [callback] - A specific callback function that should be removed. If none is passed all callbacks to the event listener will be removed.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.off = function (name, callback) {
		 	var events = $.trim(name).toLowerCase().split(" ");
			$(document).off(events.join(".ScrollScene ") + ".ScrollScene", callback)
			return ScrollScene;
		 };

		 /**
		 * Trigger an event.
		 * @public
		 *
		 * @param {string} name - The name of the event that should be fired.
		 * @param {object} [vars] - An object containing info that should be passed to the callback.
		 * @returns {ScrollScene} Parent object for chaining.
		 */
		 this.trigger = function (name, vars) {
			log(3, 'event fired:', name, "->", vars);
			var event = {
				type: $.trim(name).toLowerCase() + ".ScrollScene",
				target: ScrollScene
			}
			if ($.isPlainObject(vars)) {
				event = $.extend({}, vars, event);
			}
			// fire all callbacks of the event
			$.event.trigger(event);
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