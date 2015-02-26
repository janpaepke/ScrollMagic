// store pagewide scene options
var SCENE_OPTIONS = {
	defaults: {
		duration: 0,
		offset: 0,
		triggerElement: undefined,
		triggerHook: 0.5,
		reverse: true,
		loglevel: 2
	},
	validate: {
		offset : function (val) {
			val = parseFloat(val);
			if (!_util.type.Number(val)) {
				throw ["Invalid value for option \"offset\":", val];
			}
			return val;
		},
		triggerElement : function (val) {
			val = val || undefined;
			if (val) {
				var elem = _util.get.elements(val)[0];
				if (elem) {
					val = elem;
				} else {
					throw ["Element defined in option \"triggerElement\" was not found:", val];
				}
			}
			return val;
		},
		triggerHook : function (val) {
			var translate = {"onCenter" : 0.5, "onEnter" : 1, "onLeave" : 0};
			if (_util.type.Number(val)) {
				val = Math.max(0, Math.min(parseFloat(val), 1)); //  make sure its betweeen 0 and 1
			} else if (val in translate) {
				val = translate[val];
			} else {
				throw ["Invalid value for option \"triggerHook\": ", val];
			}
			return val;
		},
		reverse: function (val) {
			return !!val; // force boolean
		},
		// (BUILD) - REMOVE IN MINIFY - START
		loglevel: function (val) {
			val = parseInt(val);
			if (!_util.type.Number(val) || val < 0 || val > 3) {
				throw ["Invalid value for option \"loglevel\":", val];
			}
			return val;
		}
		// (BUILD) - REMOVE IN MINIFY - END
	}, // holder for  validation methods. duration validation is handled in 'getters-setters.js'
	shifts: ["duration", "offset", "triggerHook"], // list of options that trigger a `shift` event
};
/*
 * method used to add an option to ScrollMagic Scenes.
 * TODO: DOC (private for dev)
 */
ScrollMagic.Scene.addOption = function (name, defaultValue, validationCallback, shifts) {
	if (!(name in SCENE_OPTIONS.defaults)) {
		SCENE_OPTIONS.defaults[name] = defaultValue;
		SCENE_OPTIONS.validate[name] = validationCallback;
		if (shifts) {
			SCENE_OPTIONS.shifts.push(name);
		}
	} else {
		ScrollMagic._util.log(1, "[static] ScrollMagic.Scene -> Cannot add Scene option '" + name + "', because it already exists.");
	}
};
// instance extension function for plugins
// TODO: DOC (private for dev)
ScrollMagic.Scene.extend = function (extension) {
	var oldClass = this;
	ScrollMagic.Scene = function () {
		oldClass.apply(this, arguments);
		this.$super = _util.extend({}, this); // copy parent state
		return extension.apply(this, arguments) || this;
	};
	_util.extend(ScrollMagic.Scene, oldClass); // copy properties
	ScrollMagic.Scene.prototype = oldClass.prototype; // copy prototype
	ScrollMagic.Scene.prototype.constructor = ScrollMagic.Scene; // restore constructor
};