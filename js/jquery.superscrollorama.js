/*
	SUPERSCROLLORAMA - The jQuery plugin for doing scroll animations
	by John Polacek (@johnpolacek)
	
	Powered by the Greensock Tweening Platform
	http://www.greensock.com
	Greensock License info at http://www.greensock.com/licensing/
	
	Dual licensed under MIT and GPL.
*/

(function($) {
    $.superscrollorama = function(options) {
		
		var superscrollorama = this;
		var defaults = {isVertical:true};
		superscrollorama.settings = $.extend({}, defaults, options);

		
		// PRIVATE VARS
		
		var animObjects = [],
			pinnedObjects = [],
			didScrollCheck = false,
			timeline = new TimelineLite();
		
		// PRIVATE FUNCTIONS

		function init() {
			// scroll to top of page
			$('html, body').animate({ scrollTop: 0 }, 0);
			
			$(window).scroll(function() {
				didScrollCheck = true;
			});
			setInterval(function() {
				if (didScrollCheck) {
					checkScrollAnim();
					didScrollCheck = false;
				}
			}, 50);
		}
		
		function checkScrollAnim() {
			var currScrollPoint = superscrollorama.settings.isVertical ? $(window).scrollTop() : $(window).scrollLeft();
			var offsetAdjust = superscrollorama.settings.isVertical ? -$(window).height()/2 : -$(window).width()/2;
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
					animObj.tween.progress((currScrollPoint - animObj.start)/(animObj.end - animObj.start)).pause();
				} else if (currScrollPoint < startPoint && animObj.state !== 'BEFORE') {
					// if it should be at the BEFORE tween state and isn't..
					animObj.tween.reverse();
					animObj.state = 'BEFORE';
				} else if (currScrollPoint > endPoint && animObj.state !== 'AFTER') {
					// if it should be at the AFTER tween state and isn't..
					animObj.tween.play();
					animObj.state = 'AFTER';
				} else if (animObj.state === 'TWEENING') {
					// if it is TWEENING..
					animObj.tween.progress((currScrollPoint - animObj.start)/(animObj.end - animObj.start)).pause();
				}
			}
				
			// check all pinned elements
			var numPinned = pinnedObjects.length;
			for (i=0; i<numPinned; i++) {
				var pinObj = pinnedObjects[i];
				var el = pinObj.el;
				
				// should object be pinned?
				if (pinObj.state != 'PINNED') {
					
					startPoint = pinObj.spacer ?
						superscrollorama.settings.isVertical ? pinObj.spacer.offset().top : pinObj.spacer.offset().left :
						superscrollorama.settings.isVertical ? el.offset().top : el.offset().left;
					
					startPoint += pinObj.offset;
					endPoint = startPoint + pinObj.dur;
					
					if (currScrollPoint > startPoint && currScrollPoint < endPoint && pinObj.state !== 'PINNED') {
						// pin it
						pinObj.state = 'PINNED';
						
						// set original position value for unpinning
						pinObj.origPositionVal = superscrollorama.settings.isVertical ? el.css('top') : el.css('left');
						if (pinObj.origPositionVal === 'auto')
							pinObj.origPositionVal = 0;
						else
							pinObj.origPositionVal = parseInt(pinObj.origPositionVal, 10);
						
						// change to fixed position
						el.css('position','fixed');
						if (superscrollorama.settings.isVertical)
							el.css('top', 0);
						else
							el.css('left', 0);
						
						pinObj.pinStart = startPoint;
						pinObj.pinEnd = endPoint;

						if (pinObj.spacer)
							pinObj.spacer.css('height', pinObj.dur + el.outerHeight());

						if (pinObj.onPin)
							pinObj.onPin();
					}

				// Check to see if object should be unpinned
				} else {
					
					if (currScrollPoint < pinObj.pinStart || currScrollPoint > pinObj.pinEnd) {
						// unpin it
						pinObj.state = currScrollPoint < pinObj.pinStart ? 'BEFORE' : 'AFTER';

						// revert to original position value
						el.css('position',pinObj.origPosition);
						if (superscrollorama.settings.isVertical)
							el.css('top', pinObj.origPositionVal);
						else
							el.css('left', pinObj.origPositionVal);
						
						if (pinObj.spacer)
							pinObj.spacer.css('height', currScrollPoint < pinObj.pinStart ? 0 : pinObj.dur);

						if (pinObj.onUnpin)
							pinObj.onUnpin();
					}
					else if (pinObj.anim) {
						// do animation
						pinObj.anim.progress((currScrollPoint - pinObj.pinStart)/(pinObj.pinEnd - pinObj.pinStart));
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
		};
		
		
		// INIT
		init();
		
		return superscrollorama;
    };
     
})(jQuery);