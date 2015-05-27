define(["ScrollMagic"], function (ScrollMagic) {
	describe('ScrollMagic.Controller', function() {

		it("fails with invalid container", function() {
			spyOn(console, "error");
			expect(function () {
				new ScrollMagic.Controller({container: undefined});
			}).toThrow();
		});

		it("works with a custom container", function() {
			loadFixtures('container-scroll.html');
			// as a DOM element
			expect(function () {
				new ScrollMagic.Controller({container: document.querySelector("#scroll-container")});
			}).not.toThrow();
			// as a selector
			expect(function () {
				new ScrollMagic.Controller({container: "#scroll-container"});
			}).not.toThrow();
		});


	});

	describe('ScrollMagic.Controller', function() {

		var $c;			// container
		var ctrl;		// controller

		beforeEach(function() {
			// disable internal logging
			spyOn(ScrollMagic._util, "log");
			// default setup
			loadFixtures('container-scroll.html');
			$c = $('#scroll-container');
			ctrl = new ScrollMagic.Controller({container: $c[0]});
		});

		afterEach(function () {
			ctrl.destroy();
		});


		describe("every method", function () {
			var getterSetter = ["loglevel", "scrollPos", "enabled"];
			var getterOnly = ["info"];
			var exception = ["destroy"];
			it("is chainable if not a getter", function () {
				for (var m in ctrl) {
					if (typeof ctrl[m] === 'function' && exception.indexOf(m) < 0 && m[0] != "_") {
						if (getterSetter.indexOf(m) > -1 || getterOnly.indexOf(m) > -1) { // is getter
							expect(m).toWorkAsGetter(ctrl);
						} else {
							expect(m).not.toWorkAsGetter(ctrl);
						}
						if (getterOnly.indexOf(m) == -1) { // can be used as setter
							expect(m).toWorkAsChainableSetter(ctrl);
						} else {
							expect(m).not.toWorkAsChainableSetter(ctrl);
						}
					}
				}
			});
		});

		describe(".addScene()", function () {
			it("adds a new scene", function () {
				var scene = new ScrollMagic.Scene();
				spyOn(scene, 'addTo');
				ctrl.addScene(scene);
				expect(scene.addTo).toHaveBeenCalledWith(ctrl);
			});
			it("adds multiple scenes with array", function () {
				var scenes = [];
				var addTo = jasmine.createSpy("addTo");
				for (var i = 0; i<10; i++) {
					scenes[i] = new ScrollMagic.Scene();
					scenes[i].addTo = addTo;
				}
				ctrl.addScene(scenes);
				expect(addTo.calls.count()).toBe(10);
			});
			it("rejects duplicate scenes", function () {
				var scene = new ScrollMagic.Scene();
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
				var scene = new ScrollMagic.Scene();
				spyOn(scene, 'remove');
				ctrl.removeScene(scene);
				expect(scene.remove).not.toHaveBeenCalled();
				scene.addTo(ctrl);
				ctrl.removeScene(scene);
				expect(scene.remove).toHaveBeenCalled();
			});
			it("removes multiple scenes with array", function () {
				var scenes = [];
				var remove = jasmine.createSpy("remove");
				for (var i = 0; i<10; i++) {
					scenes[i] = new ScrollMagic.Scene();
					scenes[i].remove = remove;
					ctrl.addScene(scenes[i]);
				}
				ctrl.removeScene(scenes);
				expect(remove.calls.count()).toBe(10);
			});
		});

		describe(".updateScene()", function () {
			it("updates a scene with delay, but only once per cycle", function (done) {
				var scene = new ScrollMagic.Scene();
				scene.abc = true;
				spyOn(scene, 'update');
				ctrl.updateScene(scene);
				ctrl.updateScene(scene);
				ctrl.updateScene(scene);
				ctrl.updateScene(scene);
				ctrl.updateScene(scene);
				expect(scene.update).not.toHaveBeenCalled();
				window.requestAnimationFrame(function() { // wait for update cycle to go through array
					expect(scene.update.calls.count()).toBe(1);
					done();
				});
			});
			it("updates a scene immediately", function () {
				var scene = new ScrollMagic.Scene();
				spyOn(scene, 'update');
				ctrl.updateScene(scene, true);
				expect(scene.update).toHaveBeenCalled();
			});
			it("updates multiple scenes with array", function () {
				var scenes = [];
				var update = jasmine.createSpy("update");
				for (var i = 0; i<10; i++) {
					scenes[i] = new ScrollMagic.Scene();
					scenes[i].update = update;
				}
				ctrl.updateScene(scenes, true);
				expect(update.calls.count()).toBe(10);
			});
		});

		describe(".update()", function () {
			it("forces an update on attached scenes, but only once per update cycle or if called with immediately=true", function (done) {
				var scene = new ScrollMagic.Scene().addTo(ctrl);
				spyOn(scene, "update");
				window.requestAnimationFrame(function () {
					ctrl.update();
					ctrl.update(true);
					ctrl.update();
					ctrl.update();
					window.requestAnimationFrame(function () {
						// once when added, once when called with true and once per update cycle
						expect(scene.update.calls.count()).toBe(3);
						done();
					});
				});
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
					"container": $c[0],
					"isDocument": false
				};
			});
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

			it("scrolls to a certain element", function () {
				ctrl.scrollTo($(".step:eq(4)")[0]);
				expect(ctrl.scrollPos()).toBe(200);
				ctrl.scrollTo("#trigger");
				expect(ctrl.scrollPos()).toBe(250);
			});

			it("scrolls to a certain scene", function () {
				var scene = new ScrollMagic.Scene({offset: 150}).addTo(ctrl);
				ctrl.scrollTo(scene);
				expect(ctrl.scrollPos()).toBe(150);
			});

			it("is replaceable with an alternate function", function () {
				var callback = jasmine.createSpy("cb");
				ctrl.scrollTo(callback);
				ctrl.scrollTo(150);
				expect(callback).toHaveBeenCalledWith(150, undefined);
			});

			it("is replaceable with an alternate function, which accepts an additional parameter", function () {
				var callback = jasmine.createSpy("cb");
				ctrl.scrollTo(callback);
				ctrl.scrollTo(150, 5);
				expect(callback).toHaveBeenCalledWith(150, 5);
			});
		});

		describe(".scrollPos()", function () {
			it("returns the correct scroll position", function() {
				$c.scrollTop(100);
				expect(ctrl.scrollPos()).toBe(100);
			});
			it("is replaceable with an alternate function", function () {
				ctrl.scrollPos(function () {
					return 10;
				});
				expect(ctrl.scrollPos()).toBe(10);
			});
		});

		describe(".enabled()", function () {
			it("returns the current value", function () {
				expect(ctrl.enabled()).toBe(true);
				ctrl.enabled(false);
				expect(ctrl.enabled()).toBe(false);
			});
			it("prevents scene updates when false", function () {
				ctrl.enabled(false);
				var scene = new ScrollMagic.Scene().addTo(ctrl);
				spyOn(scene, "update");
				ctrl.update(true);
				expect(scene.update).not.toHaveBeenCalled();
			});
		});

		xdescribe(".destroy()", function () {

		});

	});

	describe('ScrollMagic.Controller', function() {
		describe("refreshInterval option value", function () {
			beforeEach(function() {
				spyOn(jasmine.getGlobal(), "setTimeout");
			});
			it("> 0, should poll", function () {
				new ScrollMagic.Controller({refreshInterval: 123456});
				expect(setTimeout).toHaveBeenCalled();
			});
			it("<= 0, should not poll", function () {
				new ScrollMagic.Controller({refreshInterval: 0});
				new ScrollMagic.Controller({refreshInterval: -123456});
				expect(setTimeout).not.toHaveBeenCalled();
			});
		});
	});

});
