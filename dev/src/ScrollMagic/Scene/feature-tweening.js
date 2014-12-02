var _tween;

Scene.on("progress.internal", function (e) {
	updateTweenProgress();
});
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
 * @returns {Scene} Parent object for chaining.
 */
this.setTween = function (TweenObject) {
	var newTween;
	if (!TimelineMax) {
		log(1, "ERROR: TimelineMax wasn't found. Please make sure GSAP is loaded before ScrollMagic or use asynchronous loading.");
		return Scene;
	}
	try {
		// wrap Tween into a TimelineMax Object to include delay and repeats in the duration and standardize methods.
		newTween = new TimelineMax({smoothChildTiming: true})
			.add(TweenObject)
			.pause();
	} catch (e) {
		log(1, "ERROR calling method 'setTween()': Supplied argument is not a valid TweenObject");
		return Scene;
	}
	if (_tween) { // kill old tween?
		Scene.removeTween();
	}
	_tween = newTween;

	// some properties need to be transferred it to the wrapper, otherwise they would get lost.
	if (TweenObject.repeat && TweenObject.repeat() === -1) {// TweenMax or TimelineMax Object?
		_tween.repeat(-1);
		_tween.yoyo(TweenObject.yoyo());
	}
	// (BUILD) - REMOVE IN MINIFY - START
	// Some tween validations and debugging helpers

	// check if there are position tweens defined for the trigger and warn about it :)
	if (_tween && _controller  && _options.triggerElement && _options.loglevel >= 2) {// controller is needed to know scroll direction.
		var
			triggerTweens = _tween.getTweensOf(_options.triggerElement),
			vertical = _controller.info("vertical");
		triggerTweens.forEach(function (value, index) {
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
	return Scene;
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
 * @returns {Scene} Parent object for chaining.
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
	return Scene;
};