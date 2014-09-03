describe('ScrollMagic', function() {

	var log = console.log; // loging from jasmine
	var $c;			// container
	var ctrl;		// controller

	beforeEach(function() {
		// disable internal logging
		spyOn(console, "log");
		spyOn(console, "warn");
		spyOn(console, "error");
		// default setup
		loadFixtures('container-scroll.html');
		$c = $('#scroll-container');
		ctrl = new ScrollMagic({container: $c});
	});

	afterEach(function () {
		ctrl.destroy();
	});

	describe("constructor", function () {
		it("fails with invalid container", function() {
			expect(function () {
				new ScrollMagic({container: ""});
			}).toThrow();
		});

	});

	describe("every method", function () {
		var getterSetter = ["loglevel", "scrollPos", "enabled"];
		var getterOnly = ["info"];
		var exception = ["destroy"];
		it("is chainable if not a getter", function () {
			jasmine.addMatchers(globalMatchers.methodTests);
			for (var m in ctrl) {
				if (typeof ctrl[m] === 'function' && exception.indexOf(m) < 0) {
					if (getterSetter.indexOf(m) > -1 || getterOnly.indexOf(m) > -1) { // is getter
						expect(m).toBeGetter(ctrl);
					} else {
						expect(m).not.toBeGetter(ctrl);
					}
					if (getterOnly.indexOf(m) == -1) { // can be used as setter
						expect(m).toBeChainableSetter(ctrl);
					} else {
						expect(m).not.toBeChainableSetter(ctrl);
					}
				}
			}
		});
	});

	describe(".addScene()", function () {
		it("adds a new scene", function () {
			var scene = new ScrollScene();
			spyOn(scene, 'addTo');
			ctrl.addScene(scene);
			expect(scene.addTo).toHaveBeenCalledWith(ctrl);
		});
		it("adds multiple scenes with array", function () {
			var scenes = [];
			var addTo = jasmine.createSpy("addTo");
			for (var i = 0; i<10; i++) {
				scenes[i] = new ScrollScene();
				scenes[i].addTo = addTo;
			}
			ctrl.addScene(scenes);
			expect(addTo.calls.count()).toBe(10);
		});
		it("rejects duplicate scenes", function () {
			var scene = new ScrollScene();
			spyOn(scene, 'addTo').and.callThrough();
			ctrl.addScene(scene);
			ctrl.addScene(scene);
			ctrl.addScene(scene);
			ctrl.addScene(scene);
			ctrl.addScene(scene);
			expect(scene.addTo.calls.count()).toBe(1);
		});
	});

	describe(".removeScene()", function () {
		it("removes a scene if it's attached to the controller", function () {
			var scene = new ScrollScene();
			spyOn(scene, 'remove');
			ctrl.removeScene(scene);
			expect(scene.remove).not.toHaveBeenCalled();
			scene.addTo(ctrl)
			ctrl.removeScene(scene);
			expect(scene.remove).toHaveBeenCalled();
		});
		it("removes multiple scenes with array", function () {
			var scenes = [];
			var remove = jasmine.createSpy("remove");
			for (var i = 0; i<10; i++) {
				scenes[i] = new ScrollScene();
				scenes[i].remove = remove;
				ctrl.addScene(scenes[i]);
			}
			ctrl.removeScene(scenes);
			expect(remove.calls.count()).toBe(10);
		});
	});

	describe(".updateScene()", function () {
		it("updates a scene with delay, but only once per tick", function (done) {
			var scene = new ScrollScene();
			spyOn(scene, 'update');
			ctrl.updateScene(scene);
			ctrl.updateScene(scene);
			ctrl.updateScene(scene);
			ctrl.updateScene(scene);
			ctrl.updateScene(scene);
			expect(scene.update).not.toHaveBeenCalled();
			setTimeout(function() { // wait for update tick to go through array
				expect(scene.update.calls.count()).toBe(1);
				done();
			}, 50);
		});
		it("updates a scene immediately", function () {
			var scene = new ScrollScene();
			spyOn(scene, 'update');
			ctrl.updateScene(scene, true);
			expect(scene.update).toHaveBeenCalled();
		});
		it("updates multiple scenes with array", function () {
			var scenes = [];
			var update = jasmine.createSpy("update");
			for (var i = 0; i<10; i++) {
				scenes[i] = new ScrollScene();
				scenes[i].update = update;
			}
			ctrl.updateScene(scenes, true);
			expect(update.calls.count()).toBe(10);
		});
	});

	describe(".update()", function () {
		it("forces an update on attached scenes, but only once per tick or if called with immediately=true", function (done) {
			var scene = new ScrollScene().addTo(ctrl);
			spyOn(scene, "update");
			setTimeout(function () {
				ctrl.update();
				ctrl.update(true);
				ctrl.update();
				ctrl.update();
				setTimeout(function () {
					// once when added, once when called with true and once on tick
					expect(scene.update.calls.count()).toBe(3);
					done();
				}, 50);
			}, 50);
		});
	});


	describe(".info()", function () {
		var infocheck;
		beforeEach (function () {
			infocheck = {
				"size": $c.height(), // will be set inside test
				"vertical": true,
				"scrollPos": 100,
				"scrollDirection": "FORWARD",
				"container": $c,
				"isDocument": false
			};
		})
		it("returns a single info value", function () {
			$c.scrollTop(infocheck.scrollPos);
			ctrl.update(true);
			for (var opt in infocheck) {
				expect(ctrl.info(opt)).toEqual(infocheck[opt]);
			}
		});
		it("returns an object with all info values", function () {
			$c.scrollTop(infocheck.scrollPos);
			ctrl.update(true);
			expect(ctrl.info()).toEqual(infocheck);
		});
	});

	describe(".scrollTo()", function () {
		it("scrolls to a numerical offset", function () {
			ctrl.scrollTo(100);
			expect(ctrl.scrollPos()).toBe(100);
		});

		it("scrolls to a certain scrollScene", function () {
			var scene = new ScrollScene({offset: 150}).addTo(ctrl);
			ctrl.scrollTo(scene);
			expect(ctrl.scrollPos()).toBe(150);
		});

		it("is replaceable with an alternate function", function () {
			var callback = jasmine.createSpy("cb");
			ctrl.scrollTo(callback);
			ctrl.scrollTo(150);
			expect(callback).toHaveBeenCalledWith(150);
		});
	});

	describe(".scrollPos()", function () {
		it("returns the correct scroll position", function() {
			$c.scrollTop(100);
			expect(ctrl.scrollPos()).toBe(100);
		});
	});

	describe(".enabled()", function () {
		it("returns the current value", function () {
			expect(ctrl.enabled()).toBe(true);
			ctrl.enabled(false)
			expect(ctrl.enabled()).toBe(false);
		});
		it("prevents scene updates when false", function () {
			ctrl.enabled(false)
			var scene = new ScrollScene().addTo(ctrl);
			spyOn(scene, "update");
			ctrl.update(true);
			expect(scene.update).not.toHaveBeenCalled();
		});
	});

	describe(".destroy()", function () {
		it("removes the Ticker", function() {
			spyOn(TweenMax.ticker, "removeEventListener");
			ctrl.destroy();
			expect(TweenMax.ticker.removeEventListener.calls.count()).toBe(1);
		});

		it("removes fallback events if TweenMax ticker is unavailable", function() {
			console.log = log;
			var tmp = TweenLite;
			TweenLite = undefined;
			var ctrl = new ScrollMagic();
			var scene = new ScrollScene().addTo(ctrl);
			ctrl.update(true);
			ctrl.destroy();
			spyOn(scene, "update");
			$c.trigger("resize");
			$c.trigger("scroll");
			expect(scene.update).not.toHaveBeenCalled();
			TweenLite = tmp;
		});
	});

});