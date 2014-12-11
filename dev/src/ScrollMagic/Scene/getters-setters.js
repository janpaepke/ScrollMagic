// object containing validator functions for various options
var _validate = {
	"unknownOptionSupplied" : function () {
		for (var key in _options) {
			if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
				log(2, "WARNING: Unknown option \"" + key + "\"");
				delete _options[key];
			}
		}
	},
	"duration" : function () {
		if (_util.type.Function(_options.duration)) {
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
			if (!_util.type.Number(_options.duration) || _options.duration < 0) {
				log(1, "ERROR: Invalid value for option \"duration\":", _options.duration);
				_options.duration = DEFAULT_OPTIONS.duration;
			}
		}
	},
	"offset" : function () {
		_options.offset = parseFloat(_options.offset);
		if (!_util.type.Number(_options.offset)) {
			log(1, "ERROR: Invalid value for option \"offset\":", _options.offset);
			_options.offset = DEFAULT_OPTIONS.offset;
		}
	},
	"triggerElement" : function () {
		if (_options.triggerElement) {
			var elem = _util.get.elements(_options.triggerElement)[0];
			if (elem) {
				_options.triggerElement = elem;
			} else {
				log(1, "ERROR: Element defined in option \"triggerElement\" was not found:", _options.triggerElement);
				_options.triggerElement = DEFAULT_OPTIONS.triggerElement;
			}
		}
	},
	"triggerHook" : function () {
		if (!(_options.triggerHook in TRIGGER_HOOK_VALUES)) {
			if (_util.type.Number(_options.triggerHook)) {
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
		if (!_util.type.Number(_options.loglevel) || _options.loglevel < 0 || _options.loglevel > 3) {
			var wrongval = _options.loglevel;
			_options.loglevel = DEFAULT_OPTIONS.loglevel;
			log(1, "ERROR: Invalid value for option \"loglevel\":", wrongval);
		}
	}
	// (BUILD) - REMOVE IN MINIFY - END
};

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
	} else if (!_util.type.Array(check)) {
		check = [check];
	}
	check.forEach(function (value, key) {
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
 * **Get** the associated controller.
 * @public
 * @example
 * // get the controller of a scene
 * var controller = scene.controller();
 *
 * @returns {ScrollMagic.Controller} Parent controller or `undefined`
 */
this.controller = function () {
	return _controller;
};


/**
 * **Get** or **Set** the duration option value.
 * As a setter it also accepts a function returning a numeric value.  
 * This is particularly useful for responsive setups.
 *
 * The duration is updated using the supplied function every time `Scene.refresh()` is called, which happens periodically from the controller (see ScrollMagic.Controller option `refreshInterval`).  
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
 *   durationValueCache = window.innerHeight;
 * }
 * $(window).on("resize", updateDuration); // update the duration when the window size changes
 * $(window).triggerHandler("resize"); // set to initial value
 * scene.duration(getDuration); // supply duration method
 *
 * @fires {@link Scene.change}, when used as setter
 * @fires {@link Scene.shift}, when used as setter
 * @param {(number|function)} [newDuration] - The new duration of the scene.
 * @returns {number} `get` -  Current scene duration.
 * @returns {Scene} `set` -  Parent object for chaining.
 */
this.duration = function (newDuration) {
	var varname = "duration";
	if (!arguments.length) { // get
		return _options[varname];
	} else {
		if (!_util.type.Function(newDuration)) {
			_durationUpdateMethod = undefined;
		}
		if (changeOption(varname, newDuration)) { // set
			Scene.trigger("change", {what: varname, newval: _options[varname]});
			Scene.trigger("shift", {reason: varname});
		}
	}
	return Scene;
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
 * @fires {@link Scene.change}, when used as setter
 * @fires {@link Scene.shift}, when used as setter
 * @param {number} [newOffset] - The new offset of the scene.
 * @returns {number} `get` -  Current scene offset.
 * @returns {Scene} `set` -  Parent object for chaining.
 */
this.offset = function (newOffset) {
	var varname = "offset";
	if (!arguments.length) { // get
		return _options[varname];
	} else if (changeOption(varname, newOffset)) { // set
		Scene.trigger("change", {what: varname, newval: _options[varname]});
		Scene.trigger("shift", {reason: varname});
	}
	return Scene;
};

/**
 * **Get** or **Set** the triggerElement option value.
 * Does **not** fire `Scene.shift`, because changing the trigger Element doesn't necessarily mean the start position changes. This will be determined in `Scene.refresh()`, which is automatically triggered.
 * @public
 * @example
 * // get the current triggerElement
 * var triggerElement = scene.triggerElement();
 *
	 * // set a new triggerElement using a selector
 * scene.triggerElement("#trigger");
	 * // set a new triggerElement using a DOM object
 * scene.triggerElement(document.getElementById("trigger"));
 *
 * @fires {@link Scene.change}, when used as setter
 * @param {(string|object)} [newTriggerElement] - The new trigger element for the scene.
 * @returns {(string|object)} `get` -  Current triggerElement.
 * @returns {Scene} `set` -  Parent object for chaining.
 */
this.triggerElement = function (newTriggerElement) {
	var varname = "triggerElement";
	if (!arguments.length) { // get
		return _options[varname];
	} else if (changeOption(varname, newTriggerElement)) { // set
		Scene.trigger("change", {what: varname, newval: _options[varname]});
	}
	return Scene;
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
 * @fires {@link Scene.change}, when used as setter
 * @fires {@link Scene.shift}, when used as setter
 * @param {(number|string)} [newTriggerHook] - The new triggerHook of the scene. See {@link Scene} parameter description for value options.
 * @returns {number} `get` -  Current triggerHook (ALWAYS numerical).
 * @returns {Scene} `set` -  Parent object for chaining.
 */
this.triggerHook = function (newTriggerHook) {
	var varname = "triggerHook";
	if (!arguments.length) { // get
		return _util.type.Number(_options[varname]) ? _options[varname] : TRIGGER_HOOK_VALUES[_options[varname]];
	} else if (changeOption(varname, newTriggerHook)) { // set
		Scene.trigger("change", {what: varname, newval: _options[varname]});
		Scene.trigger("shift", {reason: varname});
	}
	return Scene;
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
 * @fires {@link Scene.change}, when used as setter
 * @param {boolean} [newReverse] - The new reverse setting of the scene.
 * @returns {boolean} `get` -  Current reverse option value.
 * @returns {Scene} `set` -  Parent object for chaining.
 */
this.reverse = function (newReverse) {
	var varname = "reverse";
	if (!arguments.length) { // get
		return _options[varname];
	} else if (changeOption(varname, newReverse)) { // set
		Scene.trigger("change", {what: varname, newval: _options[varname]});
	}
	return Scene;
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
 * @fires {@link Scene.change}, when used as setter
 * @param {boolean} [newTweenChanges] - The new tweenChanges setting of the scene.
 * @returns {boolean} `get` -  Current tweenChanges option value.
 * @returns {Scene} `set` -  Parent object for chaining.
 */
this.tweenChanges = function (newTweenChanges) {
	var varname = "tweenChanges";
	if (!arguments.length) { // get
		return _options[varname];
	} else if (changeOption(varname, newTweenChanges)) { // set
		Scene.trigger("change", {what: varname, newval: _options[varname]});
	}
	return Scene;
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
 * @fires {@link Scene.change}, when used as setter
 * @param {number} [newLoglevel] - The new loglevel setting of the scene. `[0-3]`
 * @returns {number} `get` -  Current loglevel.
 * @returns {Scene} `set` -  Parent object for chaining.
 */
this.loglevel = function (newLoglevel) {
	var varname = "loglevel";
	if (!arguments.length) { // get
		return _options[varname];
	} else if (changeOption(varname, newLoglevel)) { // set
		Scene.trigger("change", {what: varname, newval: _options[varname]});
	}
	return Scene;
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
	if (_controller) {
		// get the trigger position
		if (_options.triggerElement) {
			// Element as trigger
			pos += _triggerPos;
		} else {
			// return the height of the triggerHook to start at the beginning
			pos += _controller.info("size") * Scene.triggerHook();
		}
	}
	return pos;
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