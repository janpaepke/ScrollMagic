/*!
 * @file ScrollMagic Velocity Animation Plugin.
 *
 * requires: velocity ~1.2
 * Powered by the VelocityJS: http://VelocityJS.org
 * Velocity is published under MIT license.
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['ScrollMagic', 'Velocity'], factory);
	} else {
		// Browser globals
		factory(root.ScrollMagic || (root.jQuery && root.jQuery.ScrollMagic), root.Velocity || (root.jQuery && root.jQuery.Velocity));
	}
}(this, function(ScrollMagic, velocity) {
	"use strict";
	var NAMESPACE = "animation.velocity";

	// (BUILD) - REMOVE IN MINIFY - START
	var err = Function.prototype.bind.call((console && console.error || console.log) || function() {}, console);
	if (!ScrollMagic) {
		err("(" + NAMESPACE + ") -> ERROR: The ScrollMagic main module could not be found. Please make sure it's loaded before this plugin or use an asynchronous loader like requirejs.");
	}
	if (!velocity) {
		err("(" + NAMESPACE + ") -> ERROR: Velocity could not be found. Please make sure it's loaded before ScrollMagic or use an asynchronous loader like requirejs.");
	}
	// (BUILD) - REMOVE IN MINIFY - END
	
	var autoindex = 0;

	ScrollMagic.Scene.extend(function () {
		var
			Scene = this,
			_util = ScrollMagic._util,
			_currentProgress = 0,
			_elems,
			_properties,
			_options,
			_dataID; // used to identify element data related to this scene, will be defined everytime a new velocity animation is added

		// (BUILD) - REMOVE IN MINIFY - START
		var log = function () {
			Array.prototype.splice.call(arguments, 1, 0, "(" + NAMESPACE + ")", "->");
			Scene._log.apply(this, arguments);
		};
		var newMethods = ["setVelocity", "removeVelocity"];
		newMethods.forEach(function (value) {
			if (Scene[value]) {
				log(2, "WARNING: Scene already has a method '" + value + "', which will be overwritten by plugin.");
			}
		});
		// (BUILD) - REMOVE IN MINIFY - END

		// set listeners
		Scene.on("progress.plugin_velocity", function () {
			updateAnimationProgress();
		});
		Scene.on("destroy.plugin_velocity", function (e) {
			Scene.off("*.plugin_velocity");
			Scene.removeVelocity(e.reset);
		});

		var animate = function (elem, properties, options) {
			if (_util.type.Array(elem)) {
				elem.forEach(function(elem) {
					animate(elem, properties, options);
				});
			} else {
				// set reverse values
				if (!velocity.Utilities.data(elem, _dataID)) {
					velocity.Utilities.data(elem, _dataID,
						{
							reverseProps: _util.css(elem, Object.keys(_properties))
						}
					);
				}
				// animate
				velocity(elem, properties, options);
				if (options.queue !== undefined) {
					velocity.Utilities.dequeue(elem, options.queue);
				}
			}
		};
		var reverse = function (elem, options) {
			if (_util.type.Array(elem)) {
				elem.forEach(function(elem) {
					reverse(elem, options);
				});
			} else {
				var data = velocity.Utilities.data(elem, _dataID);
				if (data && data.reverseProps) {
					velocity(elem, data.reverseProps, options);
					if (options.queue !== undefined) {
						velocity.Utilities.dequeue(elem, options.queue);
					}
				}
			}
		};

		/**
		 * Update the tween progress to current position.
		 * @private
		 */
		var updateAnimationProgress = function () {
			if (_elems) {
				var progress = Scene.progress();
				if (progress != _currentProgress) { // do we even need to update the progress?
					if (Scene.duration() === 0) {
						// play the animation
						if (progress > 0) { // play forward
							animate(_elems, _properties, _options);
						} else { // play reverse
							reverse(_elems, _options);
							// velocity(_elems, _propertiesReverse, _options);
							// velocity("reverse");
						}
					} else {
						// TODO: Scrollbound animations not supported yet...
					}
					_currentProgress = progress;
				}
			}
		};

		this.setVelocity = function (elems, properties, options) {
			if (_elems) { // kill old ani?
				Scene.removeVelocity();
			}

			_elems = _util.get.elements(elems);
			_properties = properties;
			_options = options;
			_dataID = "ScrollMagic." + NAMESPACE + "[" + (autoindex++) + "]";

			if (_options.queue !== undefined) {
				// we'll use the queue to identify the animation. When defined it will always stop the previously running one.
				// if undefined the animation will always fully run, as is expected.
				// defining anything other than 'false' as the que doesn't make much sense, because ScrollMagic takes control over the trigger.
				// thus it is also overwritten.
				_options.queue = _dataID + "_queue";
			}

			// (BUILD) - REMOVE IN MINIFY - START
			var checkDuration = function () {
				if (Scene.duration() !== 0) {
					log(1, "ERROR: The Velocity animation plugin does not support scrollbound animations (scenes with duration) yet.");
				}
			};
			Scene.on("change.plugin_velocity", function (e) {
				if (e.what == 'duration') {
					checkDuration();
				}
			});
			checkDuration();
			// (BUILD) - REMOVE IN MINIFY - END
			log(3, "added animation");

			updateAnimationProgress();
			return Scene;
		};
		this.removeVelocity = function (reset) {
			if (_elems) {
				// stop running animations
				if (_options.queue !== undefined) {
					velocity(_elems, "stop", _options.queue);
				}
				if (reset) {
					reverse(_elems, {duration: 0});
				}

				_elems.forEach(function(elem) {
					velocity.Utilities.removeData(elem, _dataID);
				});
				_elems = _properties = _options = _dataID = undefined;
			}
			return Scene;
		};
	});
}));