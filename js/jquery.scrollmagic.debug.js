/*
	@overview
	Debug Extension for ScrollMagic.
	by Jan Paepke 2014 (@janpaepke)
	http://janpaepke.github.io/ScrollMagic

	@version	1.0.4
	@license	Dual licensed under MIT license and GPL.
	@author		Jan Paepke - e-mail@janpaepke.de
*/
(function($) {
	/**
	 * Add Indicators for a ScrollScene.  
	 * __REQUIRES__ ScrollMagic Debug Extension: `jquery.scrollmagic.debug.js`  
	 * The indicatos can only be added _AFTER_ the scene has been added to a controller.
	 * @public

	 * @example
	 * // add basic indicators
	 * scene.addIndicators()
	 *
	 * // passing options
	 * scene.addIndicators({zindex: 100, colorEnd: "#FFFFFF"});
	 *
	 * @param {object} [options] - An object containing one or more options for the indicators.
	 * @param {(string|object)} [options.parent=undefined] - A selector, DOM Object or a jQuery object that the indicators should be added to.  
	 														 If undefined, the scene's container will be used.
	 * @param {number} [options.zindex=-1] - CSS zindex for the indicator container.
	 * @param {number} [options.indent=0] - Additional position offset for the indicators (useful, when having multiple scenes starting at the same time).
	 * @param {number} [options.suffix=""] - This string will be attached to the start and end indicator (useful for identification when working with multiple scenes).
	 * @param {string} [options.colorTrigger=blue] - CSS color definition for the trigger indicator.
	 * @param {string} [options.colorStart=green] - CSS color definition for the start indicator.
	 * @param {string} [options.colorEnd=red] - CSS color definition for the end indicator.
	*/
	ScrollScene.prototype.addIndicators = function(options) {
		var
			DEFAULT_OPTIONS = {
				parent: undefined,
				zindex: -1,
				indent: 0,
				suffix: "",
				colorTrigger: "blue",
				colorStart: "green",
				colorEnd: "red"
			};


		var
			scene = this,
			options = $.extend({}, DEFAULT_OPTIONS, options),
			controller = this.parent();
		if (controller) {
			var
				cParams = controller.info(),
				suffix = (options.labelSuffix == "") ? "" : " " + options.suffix,
				$container = $(options.parent).length > 0
							 ? $(options.parent)
							 : cParams.isDocument ? $("body") : cParams.container, // check if window element (then use body)
				$wrap = $("<div></div>")
						.addClass("ScrollSceneIndicators")
						.data("options", options)
						.css({
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							"text-align": "center",
							"z-index": options.zindex,
							"pointer-events": "none",
							"font-size": 10
						}),
				$triggerHook = $("<div>trigger</div>")
								.css({
									position: "fixed",
									overflow: "visible",
									color: options.colorTrigger
								})
								.addClass("hook");
				$start = $("<div>start" + suffix + "</div>")
								.css({
									position: "absolute",
									overflow: "visible",
									color: options.colorStart
								})
								.addClass("start");
				$end = $("<div>end" + suffix + "</div>")
								.css({
									position: "absolute",
									overflow: "visible",
									color: options.colorEnd
								})
								.addClass("end");

			if ($container.css("position") == "static") {
				$container.css("position", "relative"); // positioning needed for correct display of indicators
			}

			scene.indicators = $wrap
				    			.append($triggerHook)
				    			.append($start)
				    			.append($end)
				    			.appendTo($container);

			scene.updateIndicators();
			function callUpdate(e) {
				if ((e.type == "scroll" || e.type == "resize") && !cParams.isDocument) {
					scene.updateIndicators(true);
				} else {
					scene.updateIndicators();
				}
			}
			scene.on("change.debug", callUpdate)
			cParams.container.on("resize scroll", callUpdate);
			if (!cParams.isDocument) {
				$(window).on("scroll resize", callUpdate);
			}
		} else {
			console.log("ERROR: Please add Scene to controller before adding indicators.")
		}
		return scene;
	};
	ScrollScene.prototype.updateIndicators = function(triggerOnly) {
		var
			scene = this,
			controller = scene.parent(),
			indicators = scene.indicators,
			options = indicators.data("options");
		if (indicators && controller) {
			var
				cParams = controller.info(),
				$triggerHook = indicators.children(".hook"),
				$start = indicators.children(".start"),
				$end = indicators.children(".end"),
				parentOffset = cParams.container.offset() || {top: 0, left: 0},
				parentPos = cParams.vertical ? parentOffset.top : parentOffset.left,
				hookPos = (cParams.size * scene.triggerHook()) + parentPos,
				direction = cParams.vertical ? "v" : "h",
				resetCSS = { // reset (in case scene is removed from a horizontal scene and added to a vertical one)
					"border": "none",
					top: "auto",
					bottom: "auto",
					left: "auto",
					right: "auto"
				};
				if (!cParams.isDocument) {
					hookPos -=  cParams.vertical ? $(document).scrollTop() : $(document).scrollLeft();
				}

			if (cParams.isDocument) { // account for possible body positioning
				var bodyOffset = indicators.offsetParent().is("body") ? $("body").offset() : parentOffset;
				indicators.css({
					top: -bodyOffset.top,
					left: -bodyOffset.left
				})
			}

			$triggerHook
				.css(resetCSS)
				.attr("data-hook", hookPos)
				.attr("data-direction", direction)
				.data("parent", cParams.container);

			$otherhook = $(".ScrollSceneIndicators .hook[data-hook=\""+ hookPos +"\"][data-direction="+direction+"]:visible").not($triggerHook);
			if ($otherhook.length > 0 && $otherhook.data("parent") == cParams.container) {
				$triggerHook.hide();
			} else {
				$triggerHook.show();
				if (cParams.vertical) {
					// triggerHook
					$triggerHook.css({
						"border-top": "1px solid blue",
						padding: "0 8px 2px 8px",
						width: 40,
						top: hookPos,
						left: (cParams.isDocument ? cParams.container.width() : parentOffset.left + cParams.container.width() - $(document).scrollLeft()) - 70 - options.indent
					});
					// correct if too far down
					if (hookPos > cParams.size*0.8) {
						$triggerHook
							.css("border-bottom", "1px solid blue")
							.css("top", hookPos - $triggerHook.outerHeight(true))
							.css("border-top", "none");
					}
				} else {
					$triggerHook.css({
						"border-left": "1px solid blue",
						height: 20,
						padding: "5px 5px 0 5px",
						top: (cParams.isDocument ? cParams.container.height() : parentOffset.top + cParams.container.height() - $(document).scrollTop()) - 40 - options.indent,
						left: hookPos,
					});
					// correct if too far right
					if (hookPos > cParams.size*0.8) {
						$triggerHook
							.css("border-right", "1px solid blue")
							.css("left", hookPos - $triggerHook.width() - parseFloat($triggerHook.css("padding-left")))
							.css("border-left", "none");
					}
				}
			}
			
			if (!triggerOnly) {
				var
					startPos = scene.startPosition(),
					endPos = startPos + scene.duration();
				
				$start.css(resetCSS);
				$end.css(resetCSS);
				if (scene.duration() == 0) {
					$end.hide();
				} else {
					$end.show();
				}
				if (cParams.vertical) {
					// start
					$start.css({
						"border-top": "1px solid green",
						right: 71-cParams.container.scrollLeft() + options.indent,
						padding: "0 8px 0 8px",
						top: startPos
					});
					// end
					$end.css({
						"border-top": "1px solid red",
						right: 71-cParams.container.scrollLeft() + options.indent,
						padding: "0 8px 0 8px",
						top: endPos
					});
				} else {
					// start
					$start.css({
						"border-left": "1px solid green",
						bottom: 40-cParams.container.scrollTop() + options.indent,
						padding: "0 8px 0 8px",
						left: startPos
					});
					// end
					$end.css({
						"border-left": "1px solid red",
						bottom: 40-cParams.container.scrollTop() + options.indent,
						padding: "0 8px 0 8px",
						left: endPos
					});
				}
			}
		}
	};
})(jQuery);