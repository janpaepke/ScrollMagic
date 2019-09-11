(function($) {
	// yay, lets sparkle
	$.fn.sparkle = function(options) {
		var defaults = {
			// eigenschaften
			x: 0,
			y: 0,
			scaleStart: 0.2,
			scaleEnd: 1,
			amount: 1,
			gravity: 1.7,
			// animationseigenschaften
			lifetime: 1,
			delay: 0,
			duration: 0,
			maxDistance: 50,
			minDistance: 20,
			// elementeigenschaften
			className: 'spark',
			maxVariant: 5,
			elemKind: 'div'
		};
		options = $.extend({}, defaults, options || {});

		var destroyMe = function(me) {
			me.remove();
			me = null;
		};

		return this.each(function() {
			var mainAni = new TimelineLite({ delay: options.delay });
			for (var i = 1; i <= options.amount; i++) {
				var $spark = $('<' + options.elemKind + '/>', {
					class: options.className
				})
					.addClass('s' + Math.round(Math.random() * options.maxVariant))
					.appendTo(this);
				TweenMax.set($spark, {
					scale: options.scaleStart,
					autoAlpha: 0,
					top: options.y,
					left: options.x,
					marginTop: -($spark.outerHeight() / 2),
					marginLeft: -($spark.outerWidth() / 2)
				});
				var radius = Math.random() * (options.maxDistance - options.minDistance) + options.minDistance,
					angle = Math.random() * Math.PI * 2,
					flyX = Math.sin(angle) * radius;
				flyY = Math.cos(angle) * radius;
				jump = Math.random(flyY);
				flightpath = {
					curviness: 1,
					values: [
						{ x: flyX, y: flyY - jump },
						{ x: flyX * (Math.random() + 1), y: flyY + radius * options.gravity }
					]
				};
				var ani = new TimelineLite({
					delay: (options.duration / options.amount) * i,
					onComplete: destroyMe,
					onCompleteParams: [$spark]
				}).add([
					TweenMax.to($spark, 0.0001, { autoAlpha: 1 }),
					TweenMax.to($spark, options.lifetime, { bezier: flightpath, ease: Power1.easeOut }),
					TweenMax.to($spark, options.lifetime * 0.3, { scale: options.scaleEnd }),
					TweenMax.to($spark, options.lifetime * 0.5, {
						autoAlpha: 0,
						delay: options.lifetime * 0.5,
						ease: Power1.easeOut
					})
				]);
				mainAni.add(ani, 0);
			}
		});
	};
	// gangsta wrap
	$.fn.wrapEach = function(what, replace) {
		var text = this.html();
		return this.html(text.replace(what, replace));
	};
	// change behaviour of anchor links to scroll instead of jump
	$(document).on('click touchend', 'a[href^=#]', function(e) {
		var id = $(this).attr('href'),
			$elem = $(id);
		if ($elem.length > 0) {
			e.preventDefault();
			if (Modernizr.touch && myScroll) {
				// mobile
				myScroll.scrollTo(0, -$elem.offset().top - myScroll.y, 1000, IScroll.utils.ease.quadratic);
				// TweenMax.to(myScroll, 1, {y: -$elem.offset().top-$(".scrollContent").offset().top});
			} else {
				TweenMax.to(window, 1, { scrollTo: { y: $elem.offset().top } });
				if (window.history && window.history.pushState) {
					// if supported by the browser we can even update the URL.
					history.pushState('', document.title, id);
				}
			}
		}
	});
})(jQuery);
