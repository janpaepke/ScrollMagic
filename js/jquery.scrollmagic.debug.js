/*
	@overview
	Debug Extension for ScrollMagic.
	by Jan Paepke 2014 (@janpaepke)

	Dual licensed under MIT and GPL.
	@author Jan Paepke, e-mail@janpaepke.de
*/
(function($) {
	// TODO: Document
	// TODO: correct trigger indicator position when scrolling horizontally and container has top offset and when scrolling vertically
	// TODO: fix bug of wrong positioning of indicators when changing mobile orientation multiple times.
	// TODO: hide hook if there is more than one in one position
	ScrollScene.prototype.addIndicators = function(options) {
		var
			DEFAULT_OPTIONS = {
				parent: undefined,
				zindex: -1
			};


		var
			scene = this,
			options = $.extend({}, DEFAULT_OPTIONS, options),
			controller = this.parent(),
			$wrap = $("<div></div>")
					.addClass("ScrollSceneIndicators")
					.css({
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						"text-align": "center",
						"z-index": options.zindex,
						"font-size": 10
					});
		if (controller) {
			var
				cParams = controller.info(),
				$container = $(options.parent).length > 0 ?
							   $(options.parent)
							 : (cParams.isDocument) ? $("body") : cParams.container, // check if window element (then use body)
				$triggerHook = $("<div>trigger</div>")
								.css({
									position: "fixed",
									overflow: "visible",
									color: "blue"
								})
								.addClass("hook");
				$start = $("<div>start</div>")
								.css({
									position: "absolute",
									overflow: "visible",
									color: "green"
								})
								.addClass("start");
				$end = $("<div>end</div>")
								.css({
									position: "absolute",
									overflow: "visible",
									color: "red"
								})
								.addClass("end");

			if ($container.css("position") == "static") {
				$container.css("position", "relative"); // positioning needed for correct display of indicators
			}

			if ($container.find("div.ScrollSceneIndicators div.hook").length == 0) { // TODO: buggy. if multiple different ones all should be shown...

				$wrap.append($triggerHook);
			}

			if (scene.duration() != 0) { // no end indicator
				$wrap.append($end);
			}
			scene.indicators = $wrap
				    			.append($start)
				    			.appendTo($container);

			scene.updateIndicators();
			function callUpdate(e) {
				if (e.type == "scroll") {
					if (!cParams.isDocument) { // if document is scrolled and container is not the document.
						scene.updateIndicators(true);
					}
				} else {
					scene.updateIndicators();
				}
			}
			scene.on("change", callUpdate)
			cParams.container.on("resize", callUpdate);
			$(window).on("scroll", callUpdate);
		} else {
			console.log("ERROR: Please add Scene to controller before adding indicators.")
		}
		return scene;
	};
	ScrollScene.prototype.updateIndicators = function(triggerOnly) {
		var
			scene = this,
			controller = scene.parent(),
			indicators = scene.indicators;
		if (indicators && controller) {
			var
				cParams = controller.info(),
				$triggerHook = indicators.children(".hook"),
				$start = indicators.children(".start"),
				$end = indicators.children(".end"),
				parentOffset = indicators.parent().offset(),
				parentPos = cParams.vertical ? parentOffset.top : parentOffset.left,
				hookPos = (cParams.size * scene.triggerHook()) + parentPos,
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
			
			$triggerHook.css(resetCSS);

			if (cParams.vertical) {
				// triggerHook
				$triggerHook.css({
					"border-top": "1px solid blue",
					padding: "0 8px 2px 8px",
					width: 40,
					top: hookPos,
					right: 15 + $(document).innerWidth() - indicators.parent().get(0).clientWidth
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
					left: hookPos,
					bottom: 15 + $(document).innerHeight() - indicators.parent().get(0).clientHeight
				});
				// correct if too far right
				if (hookPos > cParams.size*0.8) {
					$triggerHook
						.css("border-right", "1px solid blue")
						.css("left", hookPos - $triggerHook.width() - parseFloat($triggerHook.css("padding-left")))
						.css("border-left", "none");
				}
			}
			
			if (!triggerOnly) {
				var
					startPos = scene.triggerOffset() + scene.offset(),
					endPos = startPos + scene.duration();
				
				$start.css(resetCSS);
				$end.css(resetCSS);
				if (cParams.vertical) {
					// start
					$start.css({
						"border-top": "1px solid green",
						right: 71,
						padding: "0 8px 0 8px",
						top: startPos
					});
					// end
					$end.css({
						"border-top": "1px solid red",
						right: 71,
						padding: "0 8px 0 8px",
						top: endPos
					});
				} else {
					// start
					$start.css({
						"border-left": "1px solid green",
						bottom: 40,
						padding: "0 8px 0 8px",
						left: startPos
					});
					// end
					$end.css({
						"border-left": "1px solid red",
						bottom: 40,
						padding: "0 8px 0 8px",
						left: endPos
					});
				}
			}
		}
	};
})(jQuery);