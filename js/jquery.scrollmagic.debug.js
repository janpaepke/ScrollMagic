/*
	@overview
	Debug Extension for ScrollMagic.
	by Jan Paepke 2014 (@janpaepke)

	Dual licensed under MIT and GPL.
	@author Jan Paepke, e-mail@janpaepke.de
*/
(function($) {
	ScrollScene.prototype.addIndicators = function() {
		var
			scene = this,
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
						"font-size": 10
					});
		if (controller) {
			var
				cParams = controller.info(),
				$container = ($.contains(document, cParams.container[0])) ? cParams.container : $("body"), // check if window element (then use body)
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


			if (scene.duration() != 0) {
				$wrap.append($end);
			}
			scene.indicators = $wrap
				    			.append($triggerHook)
				    			.append($start)
				    			.appendTo($container);

			scene.updateIndicators();
			function callUpdate() {
				scene.updateIndicators();
			}
			scene.on("change", callUpdate)
			cParams.container.on("resize", callUpdate);
		}
		return scene;
	};
	ScrollScene.prototype.updateIndicators = function() {
		var
			scene = this,
			pos,
			controller = scene.parent(),
			indicators = scene.indicators;
		if (indicators && controller) {
			var
				$triggerHook = indicators.children(".hook"),
				$start = indicators.children(".start"),
				$end = indicators.children(".end"),
				pos = (controller.info("size") * scene.triggerHook()) - scene.offset(),
				resetCSS = {
					"border": "none",
					top: "auto",
					bottom: "auto",
					left: "auto",
					right: "auto"
				};
			// reset (in case scene is removed from a horizontal scene and added to a vertical one)
			$triggerHook.css(resetCSS);
			$start.css(resetCSS);
			$end.css(resetCSS);

			if (controller.info("vertical")) {
				// triggerHook
				$triggerHook.css({
					"border-top": "1px solid blue",
					padding: "0 8px 2px 8px",
					width: 40,
					top: pos,
					right: 15,
				});
				// correct if too far down
				if (pos > controller.info("size")*0.8) {
					$triggerHook
						.css("border-bottom", "1px solid blue")
						.css("top", pos - $triggerHook.outerHeight(true))
						.css("border-top", "none");
				}
				// start
				$start.css({
					"border-top": "1px solid green",
					right: 71,
					padding: "0 8px 0 8px",
					top: scene.getTriggerOffset()
				})
				// end
				$end.css({
					"border-top": "1px solid red",
					right: 71,
					padding: "0 8px 0 8px",
					top: scene.getTriggerOffset() + scene.duration()
				})

			} else {
				$triggerHook.css({
					"border-left": "1px solid blue",
					height: 20,
					padding: "5px 5px 0 5px",
					left: pos,
					bottom: 15
				});
				// correct if too far right
				if (pos > controller.info("size")*0.8) {
					$triggerHook
						.css("border-right", "1px solid blue")
						.css("left", pos - $triggerHook.width() - parseFloat($triggerHook.css("padding-left")))
						.css("border-left", "none");
				}

				// start
				$start.css({
					"border-left": "1px solid green",
					bottom: 40,
					padding: "0 8px 0 8px",
					left: scene.getTriggerOffset()
				})
				// end
				$end.css({
					"border-left": "1px solid red",
					bottom: 40,
					padding: "0 8px 0 8px",
					left: scene.getTriggerOffset() + scene.duration()
				})
			}
		}
	};
})(jQuery);