/*
	SUPERSCROLLORAMA - The jQuery plugin for doing scroll animations
	by John Polacek (@johnpolacek)

	Powered by the Greensock Tweening Platform
	http://www.greensock.com
	Greensock License info at http://www.greensock.com/licensing/

	Dual licensed under MIT and GPL.

	Thanks to Jan Paepke (@janpaepke) for making some nice improvements
*/

(function($) {

	$.superscrollorama = function(options) {

		var superscrollorama = this;
		var defaults = {
			isVertical:true,		// are we scrolling vertically or horizontally?
			triggerAtCenter: true,	// the animation triggers when the respective Element's origin is in the center of the scrollarea. This can be changed here to be at the edge (-> false)
			playoutAnimations: true	// when scrolling past the animation should they be played out (true) or just be jumped to the respective last frame (false)?
		};
		superscrollorama.settings = $.extend({}, defaults, options);

		var animObjects = [],
			pinnedObjects = [],
			didScrollCheck = false;

		// PRIVATE FUNCTIONS

		function init() {
			// scroll to top of page
			$('html, body').animate({ scrollTop: 0 }, 0);

			$(window).scroll(function() {
				didScrollCheck = true;
			});
			TweenLite.ticker.addEventListener("tick", tickHandler);
		}

		function tickHandler() {
			if (didScrollCheck) {
				checkScrollAnim();
				didScrollCheck = false;
			}
		}

		// reset a pin Object
		function resetPinObj (pinObj) {
			pinObj.el.css('position',pinObj.origPosition);
			pinObj.el.css('top', pinObj.origPositioning.top);
			pinObj.el.css('bottom', pinObj.origPositioning.bottom);
			pinObj.el.css('left', pinObj.origPositioning.left);
			pinObj.el.css('right', pinObj.origPositioning.right);
		}

		// set a Tween Progress (use totalProgress for TweenMax and TimelineMax to include repeats)
		function setTweenProgress(tween, progress) {
			if (tween.totalProgress) {
				tween.totalProgress(progress).pause();
			} else {
				tween.progress(progress).pause();
			}
		}

		function checkScrollAnim() {
			var currScrollPoint = superscrollorama.settings.isVertical ? $(window).scrollTop() : $(window).scrollLeft();
			var offsetAdjust = superscrollorama.settings.triggerAtCenter ? (superscrollorama.settings.isVertical ? -$(window).height()/2 : -$(window).width()/2) : 0;
			var i, startPoint, endPoint;

			// check all animObjects
			var numAnim = animObjects.length;
			for (i=0; i<numAnim; i++) {
				var animObj = animObjects[i],
					target = animObj.target,
					offset = animObj.offset;

				if (typeof(target) === 'string') {
					startPoint = superscrollorama.settings.isVertical ? $(target).offset().top : $(target).offset().left;
					offset += offsetAdjust;
				} else if (typeof(target) === 'number')	{
					startPoint = target;
				} else if ($.isFunction(target)) {
					startPoint = target.call(this);
				} else {
					startPoint = superscrollorama.settings.isVertical ? target.offset().top : target.offset().left;
					offset += offsetAdjust;
				}

				startPoint += offset;
				endPoint = animObj.dur ? startPoint + animObj.dur : startPoint;

				if ((currScrollPoint > startPoint && currScrollPoint < endPoint) && animObj.state !== 'TWEENING') {
					// if it should be TWEENING and isn't..
					animObj.state = 'TWEENING';
					animObj.start = startPoint;
					animObj.end = endPoint;
					setTweenProgress(animObj.tween, (currScrollPoint - animObj.start)/(animObj.end - animObj.start));
				} else if (currScrollPoint < startPoint && animObj.state !== 'BEFORE') {
					// if it should be at the BEFORE tween state and isn't..
					if (superscrollorama.settings.playoutAnimations) {
						animObj.tween.reverse();
					} else {
						setTweenProgress(animObj.tween, 0);
					}
					animObj.state = 'BEFORE';
				} else if (currScrollPoint > endPoint && animObj.state !== 'AFTER') {
					// if it should be at the AFTER tween state and isn't..
					if (superscrollorama.settings.playoutAnimations) {
						animObj.tween.play();
					} else {
						setTweenProgress(animObj.tween, 1);
					}
					animObj.state = 'AFTER';
				} else if (animObj.state === 'TWEENING') {
					// if it is TWEENING..
					setTweenProgress(animObj.tween, (currScrollPoint - animObj.start)/(animObj.end - animObj.start));
				}
			}

			// check all pinned elements
			var numPinned = pinnedObjects.length;
			for (i=0; i<numPinned; i++) {
				var pinObj = pinnedObjects[i];
				var el = pinObj.el;
				var elHeight = el.outerHeight();

				// should object be pinned?
				if (pinObj.state != 'PINNED') {

					if (pinObj.state === 'UPDATE') resetPinObj(pinObj); // revert to original Position so startPoint and endPoint will be calculated to the correct values

					startPoint = pinObj.spacer ?
						superscrollorama.settings.isVertical ? pinObj.spacer.offset().top : pinObj.spacer.offset().left :
						superscrollorama.settings.isVertical ? el.offset().top : el.offset().left;

					startPoint += pinObj.offset;

					endPoint = startPoint + pinObj.dur;

					if (currScrollPoint > startPoint && currScrollPoint < endPoint) {
						// pin it
						var oldState = pinObj.state;
						pinObj.state = 'PINNED';

						// set original position values for unpinning
						pinObj.origPositioning = {
							top: el.css('top'),
							left: el.css('left'),
							bottom: el.css('bottom'),
							right: el.css('right')
						};
						// change to fixed position
						var realCoordinates = el.offset();
						el.css('position','fixed');
						if (superscrollorama.settings.isVertical) {
							el.css('top', -pinObj.offset);
							el.css('left', realCoordinates.left);	// translate from position in parent to fixed
						} else {
							el.css('left', -pinObj.offset);
							el.css('top', realCoordinates.top);	// translate from position in parent to fixed
						}

						pinObj.pinStart = startPoint;
						pinObj.pinEnd = endPoint;

						if (pinObj.spacer)
							pinObj.spacer.css('height', pinObj.dur + elHeight);

						if (oldState === "UPDATE") {
							if (pinObj.anim)
								setTweenProgress(pinObj.anim, 0); // reset the progress, otherwise the animation won't be updated to the new position
						} else if (pinObj.onPin) {
							pinObj.onPin();
						}

						// update immediately (we may be further in the animation already, i.e. refresh within the pinrange or a pinUpdate was run)
						setTweenProgress(pinObj.anim, (currScrollPoint - pinObj.pinStart)/(pinObj.pinEnd - pinObj.pinStart));
					}
				} else {
					// Check to see if object should be unpinned
					if (currScrollPoint < pinObj.pinStart || currScrollPoint > pinObj.pinEnd) {

						// unpin it
						pinObj.state = currScrollPoint < pinObj.pinStart ? 'BEFORE' : 'AFTER';
						if (pinObj.anim&&pinObj.state === 'BEFORE') {
							setTweenProgress(pinObj.anim, 0);
						} else if (pinObj.anim && pinObj.state === 'AFTER'){
							setTweenProgress(pinObj.anim, 1);
						}
						// revert to original position values
						resetPinObj(pinObj);

						if (pinObj.spacer)
							pinObj.spacer.css('height', currScrollPoint < pinObj.pinStart ? 0 : pinObj.dur);

						if (pinObj.onUnpin)
							pinObj.onUnpin();
					}
					else if (pinObj.anim) {
						// do animation
						setTweenProgress(pinObj.anim, (currScrollPoint - pinObj.pinStart)/(pinObj.pinEnd - pinObj.pinStart));
					}
				}
			}
		}

		// PUBLIC FUNCTIONS
		superscrollorama.addTween = function(target, tween, dur, offset) {

			tween.pause();

			animObjects.push({
				target:target,
				tween: tween,
				offset: offset || 0,
				dur: dur || 0,
				state:'BEFORE'
			});

			return superscrollorama;
		};

		superscrollorama.pin = function(el, dur, vars) {
			if (typeof(el) === 'string') el = $(el);
			if (vars.anim) vars.anim.pause();

			// create wrapper for pinned elements that aren't absolute or fixed position
			var pinSpacer = null;
			if (el.css('position') === 'relative' || el.css('position') === 'static') {
				pinSpacer = $('<div class="pin-spacer"></div>');
				el.before(pinSpacer);
			}

			pinnedObjects.push({
				el:el,
				state:'BEFORE',
				dur:dur,
				offset: vars.offset || 0,
				anim:vars.anim,
				origPosition:el.css('position'),
				spacer:pinSpacer,
				onPin:vars.onPin,
				onUnpin:vars.onUnpin
			});

			return superscrollorama;
		};

		superscrollorama.updatePin = function (el, dur, vars) { // Update a Pinned object. dur and vars are optional to only change vars and keep dur just pass NULL for dur
			if (typeof(el) === 'string') el = $(el);
			if (vars.anim) vars.anim.pause();
			var numPinned = pinnedObjects.length;


			for (i=0; i<numPinned; i++) {
				var pinObj = pinnedObjects[i];
				if (el.get(0) == pinObj.el.get(0)) {

					if (dur) pinObj.dur = dur;
					if (vars.anim) pinObj.anim = vars.anim;
					if (vars.offset) pinObj.offset = vars.offset;
					if (vars.onPin) pinObj.onPin = vars.onPin;
					if (vars.onUnpin) pinObj.onUnpin = vars.onUnpin;

					if ((dur || vars.anim || vars.offset) && pinObj.state === 'PINNED') { // this calls for an immediate update!
						pinObj.state = 'UPDATE';
						checkScrollAnim();
					}
				}
			}

			return superscrollorama;
		};

		superscrollorama.triggerCheckAnim = function (immediately) { // if immediately is true it will be updated right now, if false it will wait until next tweenmax tick. default is false
			if (immediately) {
				checkScrollAnim();
			} else {
				didScrollCheck = true;
			}
			return superscrollorama;
		};


		// INIT
		init();

		return superscrollorama;
	};

})(jQuery);