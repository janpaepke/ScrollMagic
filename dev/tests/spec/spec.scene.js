describe('ScrollScene', function() {

	var log = console.log; // loging from jasmine
	var $c;			// container
	var ctrl;		// controller
	var scene;	// scene

	beforeEach(function() {
		// disable internal logging
		spyOn(console, "log");
		spyOn(console, "warn");
		spyOn(console, "error");
		// default setup
		loadFixtures('container-scroll.html');
		$c = $('#scroll-container');
		ctrl = new ScrollMagic({
			refreshInterval: 9,
			container: $c
		});
		scene = new ScrollScene({
			triggerHook: "onLeave",
			triggerElement: "#trigger",
			duration: 100
		}).addTo(ctrl);
	});

	afterEach(function () {
		ctrl.destroy();
	});

	describe("constructor", function () {
		xit("doessomething", function () {
		});
	});

	describe("every method", function () {
		var getterSetter = ["duration", "offset", "triggerElement", "triggerHook", "reverse", "tweenChanges", "loglevel", "enabled", "progress"];
		var getterOnly = ["parent", "state", "scrollOffset", "triggerOffset"];
		if (new ScrollScene().triggerPosition) {
			getterOnly.push("triggerPosition") // deprecated since 1.1.0
		} else {
			log("remove test for triggerPosition!");
		}
		var exception = ["destroy"];
		if (new ScrollScene().updateIndicators) {
			exception.push("updateIndicators")
		} else {
			log("remove test for updateIndicators!");
		}
		it("is chainable if not a getter", function () {
			jasmine.addMatchers(globalMatchers.methodTests);
			for (var m in scene) {
				if (typeof scene[m] === 'function' && exception.indexOf(m) < 0) {
					if (getterSetter.indexOf(m) > -1 || getterOnly.indexOf(m) > -1) { // is getter
						expect(m).toBeGetter(scene);
					} else {
						expect(m).not.toBeGetter(scene);
					}
					if (getterOnly.indexOf(m) == -1) { // can be used as setter
						expect(m).toBeChainableSetter(scene);
					} else {
						expect(m).not.toBeChainableSetter(scene);
					}
				}
			}
		});
	});

	// main control methods

	describe(".addTo()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".remove()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".destroy()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".update()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".progress()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".refresh()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".setTween()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".removeTween()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".setPin()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".removePin()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".setClassToggle()", function () {
		xit("doessomething", function () {
		});
	});

	describe(".removeClassToggle()", function () {
		xit("doessomething", function () {
		});
	});

	// SETTER & GETTER

	describe(".duration()", function () {
		it("returns the correct value", function () {
			expect(scene.duration()).toBe(100);
			expect(new ScrollScene().offset()).toBe(0);
		});
		it("changes the value", function () {
			scene.triggerHook("onEnter");
			ctrl.scrollTo(scene.scrollOffset() + 10).update(true);
			expect(scene.state()).toBe("DURING");
			scene.duration(5).update(true);
			expect(scene.duration()).toBe(5);
			expect(scene.state()).toBe("AFTER");
			scene.duration(0).update(true);
			expect(scene.state()).toBe("DURING");
		});
		it("converts to the right type", function () {
			scene.duration("90");
			expect(scene.duration()).toBe(90);
			scene.duration(undefined);
			expect(scene.duration()).toBe(0);
		});
	});

	describe(".enabled()", function () {
		it("returns the correct value", function () {
			expect(scene.enabled()).toBe(true);
		});
		it("changes the value", function () {
			scene.triggerHook("onEnter").enabled(false);
			expect(scene.enabled()).toBe(false);
			ctrl.scrollTo(scene.scrollOffset() + 1).update(true);
			expect(scene.state()).toBe("BEFORE");
			ctrl.scrollTo(scene.scrollOffset() + 101).update(true);
			expect(scene.state()).toBe("BEFORE");
		});
		it("converts to the right type", function () {
			scene.enabled("something");
			expect(scene.enabled()).toBe(true);
			scene.enabled(undefined);
			expect(scene.enabled()).toBe(false);
		});
	});

	describe(".loglevel()", function () {
		it("returns the correct value", function () {
			expect(scene.loglevel()).toBe(2);
			expect(new ScrollScene({loglevel: 3}).loglevel()).toBe(3);
		});
		it("changes the value", function () {
			scene.triggerHook("onEnter");
			scene.loglevel(3).update(true);
			expect(console.log.calls.count()).toBe(2); // once for the change, once for the update
			scene.update(true);
			expect(console.log.calls.count()).toBe(3); // once more for the update
			
			scene.loglevel(2).update(true);
			expect(console.log.calls.count()).toBe(3); // no change for loglevel 2
			
			expect(console.warn.calls.count()).toBe(0); // warn of unknown option
			var x = new ScrollScene({loglevel: 2, unkown: 4}); // produce warning
			expect(console.warn.calls.count()).toBe(1); // warn of unknown option in scene x
			x = new ScrollScene({loglevel: 1, unkown: 4}); // suppress warning
			expect(console.warn.calls.count()).toBe(1); // no change

			expect(console.error.calls.count()).toBe(0);
			scene.duration("invalid");
			x.duration("invalid");
			expect(console.error.calls.count()).toBe(2);
			x.loglevel(0);
			x.duration("invalid");
			expect(console.error.calls.count()).toBe(2); // no change
			
		});
		it("converts to the right type", function () {
			scene.loglevel("3");
			expect(scene.loglevel()).toBe(3);
			scene.loglevel(4);
			expect(scene.loglevel()).toBe(2);
			scene.loglevel(undefined);
			expect(scene.loglevel()).toBe(2);
		});
	});

	describe(".offset()", function () {
		it("returns the correct value", function () {
			expect(scene.offset()).toBe(0);
			expect(new ScrollScene({offset: 100}).offset()).toBe(100);
		});
		it("changes the value", function () {
			scene.triggerHook("onEnter");
			ctrl.scrollTo(scene.scrollOffset() + 1).update(true);
			expect(scene.state()).toBe("DURING");
			scene.offset(5).update(true);
			expect(scene.offset()).toBe(5);
			expect(scene.state()).toBe("BEFORE");
			scene.offset(-100).update(true);
			expect(scene.state()).toBe("AFTER");
		});
		it("converts to the right type", function () {
			scene.offset("90");
			expect(scene.offset()).toBe(90);
			scene.offset(undefined);
			expect(scene.offset()).toBe(0);
		});
	});

	describe(".reverse()", function () {
		it("returns the correct value", function () {
			expect(scene.reverse()).toBe(true);
			expect(new ScrollScene({reverse: false}).reverse()).toBe(false);
		});
		it("changes the value", function () {
			scene.triggerHook("onEnter").reverse(false);
			expect(scene.reverse()).toBe(false);
			ctrl.scrollTo(scene.scrollOffset() + 1).update(true);
			expect(scene.state()).toBe("DURING");
			ctrl.scrollTo(scene.scrollOffset() - 1).update(true);
			expect(scene.state()).toBe("DURING");
			ctrl.scrollTo(scene.scrollOffset() + 101).update(true);
			expect(scene.state()).toBe("AFTER");
			ctrl.scrollTo(scene.scrollOffset() - 1).update(true);
			expect(scene.state()).toBe("AFTER");
		});
		it("converts to the right type", function () {
			scene.reverse("something");
			expect(scene.reverse()).toBe(true);
			scene.reverse(undefined);
			expect(scene.reverse()).toBe(false);
		});
	});

	describe(".triggerElement()", function () {
		it("returns the correct value", function () {
			expect(scene.triggerElement()).toBe("#trigger");
			expect(new ScrollScene({triggerElement: $("#trigger")}).triggerElement()[0]).toBe($("#trigger")[0]);
		});
		it("changes the value", function () {
			scene.triggerElement(null);
			ctrl.scrollTo(1).update(true);
			expect(scene.state()).toBe("DURING");
			scene.triggerElement("#trigger").update(true);
			expect(scene.state()).toBe("BEFORE");
		});
		it("converts to the right type", function () {
			scene.triggerElement("unknownitem");
			expect(scene.triggerElement()).toBeNull();
			scene.triggerElement(undefined);
			expect(scene.triggerElement()).toBeNull();
			scene.triggerElement("#trigger");
			expect(scene.triggerElement()).toBe("#trigger");
			scene.triggerElement($("#trigger"));
			expect(scene.triggerElement()).toEqual($("#trigger"));
		});
	});

	describe(".triggerHook()", function () {
		it("returns the correct value", function () {
			expect(scene.triggerHook()).toBe(0);
			expect(new ScrollScene().triggerHook()).toBe(0.5);
		});
		it("changes the value", function () {
			ctrl.scrollTo(scene.scrollOffset() - 1).update(true);
			expect(scene.state()).toBe("BEFORE");
			scene.triggerHook("onEnter").update(true);
			expect(scene.state()).toBe("AFTER");
			scene.triggerHook(0.4).update(true);
			expect(scene.state()).toBe("DURING");
		});
		it("converts to the right type", function () {
			scene.triggerHook("1");
			expect(scene.triggerHook()).toBe(1);
			scene.triggerHook("90");
			expect(scene.triggerHook()).toBe(1);
			scene.triggerHook(-1);
			expect(scene.triggerHook()).toBe(0);
			scene.triggerHook("asdasd");
			expect(scene.triggerHook()).toBe(0.5);
			scene.triggerHook("onEnter");
			expect(scene.triggerHook()).toBe(1);
			scene.triggerHook("onCenter");
			expect(scene.triggerHook()).toBe(0.5);
			scene.triggerHook("onLeave");
			expect(scene.triggerHook()).toBe(0);
			scene.triggerHook(undefined);
			expect(scene.triggerHook()).toBe(0.5);
		});
	});

	describe(".tweenChanges()", function () {
		it("returns the correct value", function () {
			expect(scene.tweenChanges()).toBe(false);
			expect(new ScrollScene({tweenChanges: true}).tweenChanges()).toBe(true);
		});
		it("changes the value", function () {
			scene.setTween(TweenMax.to("#target", 1, {left: 100}));
			scene.triggerHook("onEnter").tweenChanges(true);
			expect(scene.tweenChanges()).toBe(true);
			ctrl.scrollTo(scene.scrollOffset() + scene.duration()).update(true);
			expect($("#target").position().left).toBe(0); // position is still 0 because no time has passed and changes are tweened
		});
		it("converts to the right type", function () {
			scene.tweenChanges("something");
			expect(scene.tweenChanges()).toBe(true);
			scene.tweenChanges(undefined);
			expect(scene.tweenChanges()).toBe(false);
		});
	});

	// GETTER ONLY

	describe(".parent()", function () {
		it("returns the parent controller", function () {
			expect(scene.parent()).toBe(ctrl);
			scene.remove();
			expect(scene.parent()).toBeUndefined();
		});
	});

	describe(".state()", function () {
		it("returns the current scene state", function () {
			expect(scene.state()).toBe("BEFORE");
			ctrl.scrollTo(300).update(true);
			expect(scene.state()).toBe("DURING");
			ctrl.scrollTo(360).update(true);
			expect(scene.state()).toBe("AFTER");
			scene.duration(0);
			ctrl.update(true);
			expect(scene.state()).toBe("DURING");
			ctrl.scrollTo(0).update(true);
			expect(scene.state()).toBe("BEFORE");
		});
	});

	describe(".scrollOffset()", function () {
		it("returns the correct value when option offset changes", function () {
			scene.offset(50);
			expect(scene.scrollOffset()).toBe(300);
		});
		it("returns the correct value when option triggerHook changes", function () {
			scene.triggerHook(0.8);
			expect(scene.scrollOffset()).toBe(250 - ($c.height() * scene.triggerHook()));
		});
		it("returns the correct value when container is resized", function (done) {
			scene.triggerHook(1);
			$c.height(100);
			$c.on("resize", function () {
				expect(scene.scrollOffset()).toBe(250 - $c.height());
				done();
			});
		});
		it("returns the correct value when the position of the triggerElement changes", function () {
			$("#trigger").css({
				position: "relative",
				top: -20,
				margin: 10
			});
			scene.refresh();
			expect(scene.scrollOffset()).toBe(240);
		});
		it("returns the correct value after the scene is added or removed", function () {
			expect(scene.scrollOffset()).toBe(250);
			scene.remove();
			scene.triggerHook("onCenter");
			expect(scene.scrollOffset()).toBe(250); // shouldn't change, when not attached to a controller
			scene.addTo(ctrl);
			expect(scene.scrollOffset()).toBe(250 - ($c.height() * scene.triggerHook()));
		});
	});

	describe(".triggerPosition()", function () {
		it("returns the position of the trigger", function () {
			expect(scene.triggerPosition()).toBe($("#trigger").offset().top - $c.offset().top);
		});
		it("returns the position of the trigger including offset", function () {
			expect(scene.offset(100).triggerPosition()).toBe($("#trigger").offset().top - $c.offset().top + 100);
		});
		it("returns the triggerHook position if no triggerElement is defined", function () {
			scene.triggerHook("onEnter").triggerElement(undefined);
			expect(scene.triggerPosition()).toBe($c.height());
		});
	});

	// debugging

	describe(".addIndicators()", function () {
		xit("doessomething", function () {
		});
	});


});