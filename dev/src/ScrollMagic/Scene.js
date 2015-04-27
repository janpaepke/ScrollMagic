/**
 * A Scene defines where the controller should react and how.
 *
 * @class
 *
 * @example
 * // create a standard scene and add it to a controller
 * new ScrollMagic.Scene()
 *		.addTo(controller);
 *
 * // create a scene with custom options and assign a handler to it.
 * var scene = new ScrollMagic.Scene({
 * 		duration: 100,
 *		offset: 200,
 *		triggerHook: "onEnter",
 *		reverse: false
 * });
 *
 * @param {object} [options] - Options for the Scene. The options can be updated at any time.  
 							   Instead of setting the options for each scene individually you can also set them globally in the controller as the controllers `globalSceneOptions` option. The object accepts the same properties as the ones below.  
 							   When a scene is added to the controller the options defined using the Scene constructor will be overwritten by those set in `globalSceneOptions`.
 * @param {(number|function)} [options.duration=0] - The duration of the scene. 
 										  If `0` tweens will auto-play when reaching the scene start point, pins will be pinned indefinetly starting at the start position.  
 										  A function retuning the duration value is also supported. Please see `Scene.duration()` for details.
 * @param {number} [options.offset=0] - Offset Value for the Trigger Position. If no triggerElement is defined this will be the scroll distance from the start of the page, after which the scene will start.
 * @param {(string|object)} [options.triggerElement=null] - Selector or DOM object that defines the start of the scene. If undefined the scene will start right at the start of the page (unless an offset is set).
 * @param {(number|string)} [options.triggerHook="onCenter"] - Can be a number between 0 and 1 defining the position of the trigger Hook in relation to the viewport.  
 															  Can also be defined using a string:
 															  ** `"onEnter"` => `1`
 															  ** `"onCenter"` => `0.5`
 															  ** `"onLeave"` => `0`
 * @param {boolean} [options.reverse=true] - Should the scene reverse, when scrolling up?
 * @param {number} [options.loglevel=2] - Loglevel for debugging. Note that logging is disabled in the minified version of ScrollMagic.
 										  ** `0` => silent
 										  ** `1` => errors
 										  ** `2` => errors, warnings
 										  ** `3` => errors, warnings, debuginfo
 * 
 */
ScrollMagic.Scene = function (options) {

	/*
	 * ----------------------------------------------------------------
	 * settings
	 * ----------------------------------------------------------------
	 */

	var
		NAMESPACE = 'ScrollMagic.Scene',
		SCENE_STATE_BEFORE = 'BEFORE',
		SCENE_STATE_DURING = 'DURING',
		SCENE_STATE_AFTER = 'AFTER',
		DEFAULT_OPTIONS = SCENE_OPTIONS.defaults;

	/*
	 * ----------------------------------------------------------------
	 * private vars
	 * ----------------------------------------------------------------
	 */

	var
		Scene = this,
		_options = _util.extend({}, DEFAULT_OPTIONS, options),
		_state = SCENE_STATE_BEFORE,
		_progress = 0,
		_scrollOffset = {start: 0, end: 0}, // reflects the controllers's scroll position for the start and end of the scene respectively
		_triggerPos = 0,
		_enabled = true,
		_durationUpdateMethod,
		_controller;

	/**
	 * Internal constructor function of the ScrollMagic Scene
	 * @private
	 */
	var construct = function () {
		for (var key in _options) { // check supplied options
			if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
				log(2, "WARNING: Unknown option \"" + key + "\"");
				delete _options[key];
			}
		}
		// add getters/setters for all possible options
		for (var optionName in DEFAULT_OPTIONS) {
			addSceneOption(optionName);
		}
		// validate all options
		validateOption();
	};
	
	// @include('Scene/event-management.js')

	// @include('Scene/core.js')

	// @include('Scene/update-params.js')

	// @include('Scene/getters-setters.js')
	
	// @include('Scene/feature-pinning.js')

	// @include('Scene/feature-classToggles.js')

	// INIT
	construct();
	return Scene;
};

// @include('Scene/_static.js')
