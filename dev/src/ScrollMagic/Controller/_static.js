// store pagewide controller options
var CONTROLLER_OPTIONS = {
	defaults: {
		container: window,
		vertical: true,
		globalSceneOptions: {},
		loglevel: 2,
		refreshInterval: 100
	}
};
/*
 * method used to add an option to ScrollMagic Scenes.
 */
ScrollMagic.Controller.addOption = function (name, defaultValue) {
	CONTROLLER_OPTIONS.defaults[name] = defaultValue;
};
// instance extension function for plugins
ScrollMagic.Controller.extend = function (extension) {
	var oldClass = this;
	ScrollMagic.Controller = function () {
		oldClass.apply(this, arguments);
		this.$super = _util.extend({}, this); // copy parent state
		return extension.apply(this, arguments) || this;
	};
	_util.extend(ScrollMagic.Controller, oldClass); // copy properties
	ScrollMagic.Controller.prototype = oldClass.prototype; // copy prototype
	ScrollMagic.Controller.prototype.constructor = ScrollMagic.Controller; // restore constructor
};