/*
	ScrollMagic - The jQuery plugin for doing magical scroll animations
	by Jan Paepke (@janpaepke)

	Inspired by and partially based on the one and only SUPERSCROLLORAMA by John Polacek (@johnpolacek)
	johnpolacek.github.com/superscrollorama/

	Powered by the Greensock Tweening Platform
	http://www.greensock.com/js
	Greensock License info at http://www.greensock.com/licensing/

	Dual licensed under MIT and GPL.
*/

// TODO: add Event Listeners
// TODO: test what happens if triggers ar tweened or pinned
// TODO: test / implement mobile capabilities
// TODO: make console logs & errors optional (debug switch)

(function($) {

/*
 * ----------------------------------------------------------------
 * avoid errors when using console
 * ----------------------------------------------------------------
 */
var console = (window.console = window.console || {});
if (!console['log']) {
	console.log = function () {};
}
if (!console['error']) {
	console.error = function (msg) {
		console.log(msg);
	};
}
if (!console['warn']) {
	console.warn = function (msg) {
		console.log(msg);
	};
}

	/**
     * CLASS ScrollMagic (main controller)
     *
     * (TODO: Description)
     *
     * @constructor
     *
	 * @param {String|Object} [settings.scrollContainer=$(window)] A selector or a jQuery object that references the main container for scrolling.
     * @param {Boolean} [settings.isVertical=true] Defines if the controller reacts to vertical (<code>true</code>) or horizontal (<code>false</code>) scrolling.
	 * @param {Boolean} [settings.reverse=true] Global setting to prevent Scenes from reversing, when scrolling back up. Can be set globally here or individually for each scene.
     *
     */
	ScrollMagic = function(settings) {

		var defaultSettings = {
			scrollContainer: $(window),
			isVertical:true,
			reverse: true
		};

		/*
		 * ----------------------------------------------------------------
		 * private vars
		 * ----------------------------------------------------------------
		 */

		var
			ScrollMagic = this,
			_settings = $.extend({}, defaultSettings, settings),
			_sceneObjects = [],
			_doUpdateOnNextTick = false,
			_currScrollPoint = 0,
			_containerInnerOffset = 0,
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
			// check ScrolContainer
			try {
				if (typeof _settings.scrollContainer == "string")
					_settings.scrollContainer = $(_settings.scrollContainer).first();
				if (_settings.scrollContainer.length == 0)
					throw "No valid scroll container supplied";
			} catch (e) {
				console.error("ERROR: " + e);
				return; // cancel
			}
			// set event handlers
			_settings.scrollContainer.scroll(function() {
				_doUpdateOnNextTick = true;
			});
			_settings.scrollContainer.resize(function() {
				_doUpdateOnNextTick = true;
			});
			TweenLite.ticker.addEventListener("tick", onTick);
			updateContainer();
		};

		/**
	     * Handle updates on tick instad of on scroll (performance)
	     * @private
	     */
		var onTick = function () {
			if (_doUpdateOnNextTick) {
				updateContainer();
				updateScenes();
				_doUpdateOnNextTick = false;
			}
		};

		/**
	     * Update container params.
	     * @private
	     */
		var updateContainer = function () {
			var
				vertical = _settings.isVertical,
				$container = _settings.scrollContainer,
				offset = $container.offset() || {top: 0, left: 0};

			_currScrollPoint = vertical ? $container.scrollTop() : $container.scrollLeft();
			_viewPortSize = vertical ? $container.height() : $container.width();
			// TODO: check usage of inner offset. Not very elegant atm. How to make better?
			if (offset.top != 0 || offset.left != 0) { // the container is not the window or document, but a div container
				// calculate the inner offset of the container, if the scrollcontainer is not at the top left position
				_containerInnerOffset = (vertical ? offset.top : offset.left) - _currScrollPoint;
			} else {
				_containerInnerOffset = 0;
			}
		};

		/**
	     * Update all scenes according to the scroll position of the container.
	     * @private
	     */
		var updateScenes = function () {
			$.each(_sceneObjects, function (index, scene) {
				updateScene(scene);
			});
		};

		/**
	     * Update a specific scene according to the scroll position of the container.
	     * @private
	     *
	     * @param {ScrollScene} scene The ScollScene object that is supposed to be updated.
	     */
		var updateScene = function (scene) {
			var
				startPoint,
				endPoint,
				newProgress;

			// get the start position
			startPoint = scene.getTriggerOffset();

			// add optional offset
			startPoint -= scene.options.offset;

			// account for the possibility that the parent is a div, not the document
			startPoint -= _containerInnerOffset;

			// calculate start point in relation to viewport trigger point
			startPoint -= _viewPortSize*scene.getViewportTrigger();

			// where will the scene end?
			endPoint = startPoint + scene.duration();

			newProgress = (_currScrollPoint - startPoint)/(endPoint - startPoint);
			console.log({
				"startPoint" : startPoint,
				"endPoint" : endPoint,
				"curScrollPoint" : _currScrollPoint
			});
			// startPoint is neccessary inside the class for the calculation of the fixed position for pins.
			scene.info.startPoint = startPoint;
			// TODO: consider setting startPoint and currScrollpoint instead of progress
			scene.progress(newProgress);
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
	     * @param {ScrollScene} scene The ScollScene to be added.
	     * @return {ScrollMagic} 
	     */
		ScrollMagic.add = function (ScrollScene) {
			_sceneObjects.push(ScrollScene);
			if (!_settings.reverse) {
				ScrollScene.options.reverse = false;	
			}
			ScrollScene.info.isVertical = _settings.isVertical;
			// TODO: update this scene immediately? (might not be desired)
			// TODO: call updateScene(thisscene) onChange
			return ScrollMagic;
		};

		/**
	     * Shorthand function to add a scene to support easier chaining.
	     * @public
	     *
	     * @param {String|Object} trigger The ScollScene object that is supposed to be updated.
	     * @param {Number} [duration=0] The ScollScene object that is supposed to be updated.
	     * @param {Number} [options.offset=0] Offset Value for the Trigger Position
	     * @param {Float|String|Function} [options.triggerPosition="onEnter"] Can be string <code>"onCenter", "onEnter", "onLeave"</code> or float (<code>0 - 1</code>), 0 = onLeave, 1 = onEnter or a function (returning a value from 0 to 1)
	     * @param {Boolean} [options.reverse=true] Should the scene reverse, when scrolling up?
	     * @param {Boolean} [options.smoothTweening=false] Tweens Animation to the progress target instead of setting it. Requires a TimelineMax Object for tweening. Does not affect animations where <code>duration==0</code>
	     * @return {ScrollScene}
	     * 
	     * @see ScrollScene
	     */
		ScrollMagic.addScene = function (trigger, duration, options) {
			var newScene = new ScrollScene(trigger, duration, options);
			ScrollMagic.add(newScene);
			return newScene;
		};

		// TODO: method -> remove scene 

		/**
	     * Force an update of all Scenes.
	     * @public
	     *
	     * @param {Boolean} [immediately=false] If <code>true</code> it will be updated right now, if <code>false</code> it will wait until next tweenmax tick
	     * @return {ScrollMagic} 
	     */
		ScrollMagic.updateScenes = function (immediately) {
			if (immediately) {
				updateScenes();
			} else {
				_doUpdateOnNextTick = true;
			}
			return ScrollMagic;
		};

		// INIT
		construct();
		return ScrollMagic;
	};


	/**
     * CLASS ScrollScene (scene controller)
     *
     * @param {String|Object} trigger The ScollScene object that is supposed to be updated.
     * @param {Number} [duration=0] The ScollScene object that is supposed to be updated.
     * @param {Number} [options.offset=0] Offset Value for the Trigger Position
     * @param {Float|String|Function} [options.triggerPosition="onEnter"] Can be string <code>"onCenter", "onEnter", "onLeave"</code> or float (<code>0 - 1</code>), 0 = onLeave, 1 = onEnter or a function (returning a value from 0 to 1)
     * @param {Boolean} [options.reverse=true] Should the scene reverse, when scrolling up?
     * @param {Boolean} [options.smoothTweening=false] Tweens Animation to the progress target instead of setting it. Requires a TimelineMax Object for tweening. Does not affect animations where <code>duration==0</code>
     * @return {ScrollScene}
     * 
     */
	ScrollScene = function (trigger, duration, options) {
		// TODO: Add event handlers: onChange, onEnter, onLeave, onUpdate, onTween

		var defaultOptions = {
			offset: 0,
			triggerPosition: "onEnter",
			reverse: true,
			smoothTweening: false
		};

		/*
		 * ----------------------------------------------------------------
		 * private vars
		 * ----------------------------------------------------------------
		 */

		var
			ScrollScene = this,
			_state = 'BEFORE',
			_tween,
			_pin,
			_trigger = typeof trigger === "string" ? $(trigger).first() : trigger,
			_duration = duration || 0;
			_progress = 0;

		/*
		 * ----------------------------------------------------------------
		 * public vars
		 * ----------------------------------------------------------------
		 */

		 ScrollScene.options = $.extend({}, defaultOptions, options);
		 ScrollScene.info = {
		 	isVertical: false,
		 	startPoint: 0
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
			checkOptionsValidity();
		}

		/**
	     * Check the validity of all options and reset to default if neccessary.
	     * @private
	     */
		var checkOptionsValidity = function () {
			var o = ScrollScene.options;
			if (typeof o.offset !== "number") {
				console.error("ERROR: Invalid value for ScrollScene option \"offset\": " + o.offset);
				o.offset = 0;
			}
			if (typeof o.triggerPosition !== "number" && $.inArray(o.triggerPosition, ["onEnter", "onCenter", "onLeave"]) == -1) {
				console.error("ERROR: Invalid value for ScrollScene option \"triggerPosition\": " + o.triggerPosition);
				o.triggerPosition = "onCenter";
			}
			if (_tween) {
				if (o.smoothTweening && !_tween.tweenTo) {
					console.warn("WARNING: ScrollScene option \"smoothTweening = true\" only works with TimelineMax objects!");
				}
			}
		};

		/**
	     * Update the tween progress.
	     * @private
	     *
	     * @param {Number} [to] If not set the scene Progress will be used. (most cases)
	     * @return {Boolean} <code>true</code> if the Tween was updated. 
	     */
		var updateTweenProgress = function (to) {
			var
				updated = false;
				progress = (to === undefined) ? _progress : to;
			if (_tween) {
				updated = true;
				// check if the tween is an infinite loop (possible with TweenMax / TimelineMax)
				var infiniteLoop = _tween.repeat ? (_tween.repeat() === -1) : false;
				if (infiniteLoop) {
					if ((_state === "DURING" || (_state === "AFTER" && _duration == 0)) && _tween.paused()) {
						_tween.play();
						// TODO: optional: think about running the animation in reverse (.reverse()) when starting scene from bottom. Desired behaviour? Might require tween.yoyo() to be true
					} else if (_state !== "DURING" && !_tween.paused()) {
						_tween.pause();
					} else {
						updated = false;
					}
				} else {
					// no infinite loop - so should we just play through or go to a specific point in time?
					if (_duration == 0) {
						// play the animation
						if (_state == "AFTER") { // play from 0 to 1
							_tween.play();
						} else { // play from 1 to 0
							_tween.reverse();
						}
					} else {
						// go to a specific point in time
						if (ScrollScene.options.smoothTweening && _tween.tweenTo) {
							// only works for TimelineMax
							_tween.tweenTo(progress);
						} else if (_tween.totalProgress) {
							// use totalProgress for TweenMax and TimelineMax to include repeats
							_tween.totalProgress(progress).pause();
						} else {
							// everything else
							_tween.pause(progress);
						}
					}
				}
				return updated;
			}
		};

		/**
	     * Update the pin progress.
	     * @private
	     */
		var updatePinProgress = function () {
			// TODO: check/test functionality – especially for horizontal scrolling
			var
				css;
			if (_pin) {
				var spacer =  _pin.parent();
				if (_state === "BEFORE") {
					// original position
					css = {
						position: "absolute",
						top: 0,
						left: 0
					}
				} else if (_state === "AFTER") {
					// position after pin
					css = {
						position: "absolute",
						top: _duration,
						left: 0
					}
				} else {
					// position during pin
					var
						spacerOffset = spacer.offset(),
						fixedPosTop,
						fixedPosLeft;
					if (ScrollScene.info.isVertical) {
						fixedPosTop = spacerOffset.top - ScrollScene.info.startPoint;
						fixedPosLeft = spacerOffset.left;
					} else {
						fixedPosTop = spacerOffset.top;
						fixedPosLeft = spacerOffset.left - ScrollScene.info.startPoint;
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


		/*
		 * ----------------------------------------------------------------
		 * public functions
		 * ----------------------------------------------------------------
		 */

		/**
		 * Get trigger.
		 * @public
		 *
		 * @returns {Number|Object}
		 *//**
		 * Set trigger.
		 * @public
		 *
		 * @param {Number|Object} newTrigger The new trigger of the scene.
		 * @returns {ScrollScene}
		 */
		ScrollScene.trigger = function (newTrigger) {
			if (!arguments.length) { // get
				return _trigger;
			} else { // set
				_trigger = typeof newTrigger === "string" ? $(newTrigger).first() : newTrigger;
				// TODO: call onChange
				return ScrollScene;
			}
		};

		/**
		 * Get duration.
		 * @public
		 *
		 * @returns {Number}
		 *//**
		 * Set duration.
		 * @public
		 *
		 * @param {Number} newDuration The new duration of the scene.
		 * @returns {ScrollScene}
		 */
		ScrollScene.duration = function (newDuration) {
			if (!arguments.length) { // get
				return _duration;
			} else { // set
				_duration = newDuration;
				// TODO: call onChange
				return ScrollScene;
			}
		};

		/**
		 * Set Option(s) (setter only, as getter is scene.options)
		 * Can also be achieved using scene.options.key = value; but included for easier chaining
		 * @public
		 *
		 * @param {Object} options One or more new Option(s) to be changed for the scene.
		 * @returns {ScrollScene}
		 * @see ScrollScene
		 */
		ScrollScene.setOption = function (options) {
			ScrollScene.options = $.extend({}, ScrollScene.options, options);
			checkOptionsValidity();
			return ScrollScene;
		};

		/**
		 * Get Scene progress (<code>0 - 1</code>). 
		 * @public
		 *
		 * @returns {Number}
		 *//**
		 * Set Scene progress.
		 * @public
		 *
		 * @param {Number} progress The new progress value of the scene (<code>0 - 1</code>).
		 * @returns {ScrollScene}
		 */
		ScrollScene.progress = function (progress) {
			if (!arguments.length) { // get
				return _progress;
			} else { // set
				var
				doUpdate = false;
				if (progress <= 0 && _state !== 'BEFORE' && ScrollScene.options.reverse) {
					// go back to initial state
					_progress = 0;
					doUpdate = true;
					_state = 'BEFORE';
				} else if (progress >= 1 && _state !== 'AFTER') {
					_progress = 1;
					doUpdate = true;
					_state = 'AFTER';
				} else if (progress > 0 && progress < 1 && (_state !== 'AFTER' || ScrollScene.options.reverse)) {
					_progress = progress;
					doUpdate = true;
					_state = 'DURING';
				}
				if (doUpdate) {
					updateTweenProgress();
					// TODO: if updated call onUpdate
					updatePinProgress();
				}


				console.log({
						"progress" : _progress,
						"state" : _state,
						"reverse" : ScrollScene.options.reverse
					});
				return ScrollScene;
			}
		};

		/**
		 * Add a tween to the scene (one TweenMax object per scene!).
		 * @public
		 *
		 * @param {object} TweenMaxObject A TweenMax object that should be animated during the scene.
		 * @returns {ScrollScene}
		 */
		ScrollScene.setTween = function (TweenMaxObject) {
			if (_tween) { // kill old tween?
				ScrollScene.removeTween();
			}
			try {
				_tween = TweenMaxObject.pause();
			} catch (e) {
				console.error("ERROR: Supplied argument is not a valid TweenMaxObject");
			} finally {
				checkOptionsValidity();
				return ScrollScene;
			}
		};

		/**
		 * Remove the tween from the scene.
		 * @public
		 *
		 * @param {Boolean} [reset=false] If <code>true</code> the tween weill be reset to start values.
		 * @returns {ScrollScene}
		 */
		ScrollScene.removeTween = function (reset) {
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
		 * @param {String|object} element
		 * @param {object} [settings.pushFollowers=true] If true following elements will be "pushed" down, if false the pinned element will just scroll past them
		 * @param {object} [settings.spacerClass="superscrollorama-pin-spacer"] Classname of the pin spacer element
		 * @returns {ScrollScene}
		 */
		ScrollScene.setPin = function (element, settings) {
			var defaultSettings = {
				pushFollowers: true,
				spacerClass: "superscrollorama-pin-spacer"
			};
			// TODO: check for duration = 0 - well what then...

			// validate Element
			try {
				if (typeof(element) === 'string')
					element = $(element).first();
				if (element.length == 0)
					throw "Invalid pin element supplied.";
			} catch (e) {
				console.error("ERROR: " + e);
				return ScrollScene; // cancel
			}

			if (_pin) { // kill old pin?
				ScrollScene.removePin();
			}
			_pin = element;


			var
				settings = $.extend({}, defaultSettings, settings);


			// create spacer
			var spacer = $("<div>&nbsp;</div>") // for some reason a completely empty div can cause layout changes sometimes.
					.addClass(settings.spacerClass)
					.css({
						position: "relative",
						top: _pin.css("top"),
						left: _pin.css("left"),
						bottom: _pin.css("bottom"),
						right: _pin.css("right")
					})

			if (_pin.css("position") == "absolute") {
				// well this is easy.
				// TODO: Testing
				spacer.css({
						width: 0,
						height: 0
					});
			} else {
				// a little more challenging.
				spacer.css({
						display: _pin.css("display"),
						width: parseFloat(_pin.css("width")) + parseFloat(_pin.css("border-left")) + parseFloat(_pin.css("border-right")) + parseFloat(_pin.css("padding-left")) + parseFloat(_pin.css("padding-right")) + parseFloat(_pin.css("margin-left")) + parseFloat(_pin.css("margin-right")),
						height: parseFloat(_pin.css("height")) + parseFloat(_pin.css("border-top")) + parseFloat(_pin.css("border-bottom")) + parseFloat(_pin.css("padding-top")) + parseFloat(_pin.css("padding-bottom")) + parseFloat(_pin.css("margin-top")) + parseFloat(_pin.css("margin-bottom"))
					});
			}

			if (settings.pushFollowers) {
				// TODO: Maybe move to scene update of main class? Reason: setPin might be called before adding the scene to the controller and so before it is clear if the scroll is vertical or not...
				// TODO: update spacer size on duration change. Maybe by moving to update scene method of main class? (see above)
				if (ScrollScene.info.isVertical) {
					spacer.height(spacer.height() + _duration);
				} else {
					spacer.width(spacer.width() + _duration);
				}
			}
			
			// now place the pin element inside the spacer	
			_pin.wrap(spacer)
					.data("style", _pin.attr("style") || "") // save old styles (for reset)
					.css({										// set new css
						position: "absolute",
						top: 0,
						left: 0
					});

			return ScrollScene;
		};

		
		/**
		 * Remove the pin from the scene.
		 * @public
		 *
		 * @param {Boolean} [reset=false] If <code>false</code> the spacer will not be removed and the element's position will not be reset.
		 * @returns {ScrollScene}
		 */
		ScrollScene.removePin = function (reset) {
			if (_pin) {
				var spacer = _pin.parent();
				if (reset) {
					_pin.insertBefore(spacer)
						.attr("style", _pin.data("style"));
					spacer.remove();
				} else {
					_pin.css({
						position: "absolute",
						top: ScrollScene.info.isVertical ? _duration * _progress : 0,
						left: ScrollScene.info.isVertical ? 0 : _duration * _progress
					});
				}
				_pin = null;
			}
			return ScrollScene;
		};

		/**
		 * Get the viewport trigger.
		 * Returns a number from 0 to 1 that defines where on the viewport the offset and startPosition should be related to.
		 * @public
		 *
		 * @returns {Number}
		 */
		ScrollScene.getViewportTrigger = function () {
			// TODO => move to main class (ScrollMagic)? Not sure...
			var triggerPoint,
				opt = ScrollScene.options;
			if (typeof opt.triggerPosition === 'function') {
				triggerPoint = opt.triggerPosition();
			} else if (typeof opt.triggerPosition === 'number') {
				triggerPoint = opt.triggerPosition;
			} else {
				switch(opt.triggerPosition) {
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
		};
		
		/**
		 * Return the trigger Offset.
		 * (always numerical, whereas trigger can also be a jquery object)
		 * @public
		 *
		 * @returns {Number}
		 */
		ScrollScene.getTriggerOffset = function () {
			if (typeof(_trigger) === 'number') {
				// numeric point as trigger
                startPoint = trigger;
			} else {
				// jQuery Object as trigger
				var targetOffset = _trigger.offset();
				return ScrollScene.info.isVertical ? targetOffset.top : targetOffset.left;	
			}
		};


		// INIT
		construct();
		return ScrollScene;
	}

})(jQuery);