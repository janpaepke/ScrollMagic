define(["ScrollMagic"], function (ScrollMagic) {
	describe('ScrollMagic.Scene', function() {

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


		describe("event management", function () {
			var scene;
			var spy1;
			var spy2;
			var spy3;
			beforeEach(function() {
				scene = new ScrollMagic.Scene();
				spy1 = jasmine.createSpy('callback1');
				spy2 = jasmine.createSpy('callback2');
				spy3 = jasmine.createSpy('callback3');
			});

			// adding
			describe (".on()", function () {
				it("does not use wildcards as event name", function () {
					scene.on("*", spy1);
					scene.on("*.namespace", spy1);
					scene.trigger("*");
					expect(spy1).not.toHaveBeenCalled();
				});
				it("adds a callback", function () {
					scene.on("add", spy1);
					scene.trigger("add");
					expect(spy1).toHaveBeenCalled();
				});
				it("adds a callback multiple times", function () {
					scene.on("add", spy1);
					scene.on("add", spy1);
					scene.trigger("add");
					expect(spy1.calls.count()).toBe(2);
				});
				it("adds multiple listeners at once", function () {
					scene.on("add remove", spy1);
					scene.trigger("add");
					scene.trigger("remove");
					expect(spy1.calls.count()).toBe(2);
				});
			});

			// triggering
			describe (".trigger()", function () {
				it("does not trigger multiple listeners at once", function () {
					scene.on("add remove", spy1);
					scene.trigger("add remove");
					expect(spy1).not.toHaveBeenCalled();
				});
				it("calls specific listeners with and without namespace", function () {
					scene.on("add", spy1);
					scene.on("add.namespace", spy2);
					scene.trigger("add");
					expect(spy1).toHaveBeenCalled();
					expect(spy2).toHaveBeenCalled();
				});
				it("calls specific listeners with a specific namespace", function () {
					scene.on("add", spy1);
					scene.on("add.namespace1", spy2);
					scene.on("add.namespace2", spy3);
					scene.trigger("add.namespace2");
					expect(spy1).not.toHaveBeenCalled();
					expect(spy2).not.toHaveBeenCalled();
					expect(spy3).toHaveBeenCalled();
				});
				// wildcards shouldn't work for triggers to make sure a specific event is triggered
				it("does not call all listeners with a specific namespace", function () {
					scene.on("add.namespace1", spy1);
					scene.on("remove.namespace1", spy1);
					scene.trigger("*.namespace1");
					expect(spy1).not.toHaveBeenCalled();
				});

				// vars & co
				it("passes the scene as the context of the callback", function () {
					scene.on("add", spy1);
					scene.trigger("add");
					expect(spy1.calls.mostRecent().object).toBe(scene);
				});
				it("passes an event object to callback", function () {
					scene.on("add", spy1);
					scene.trigger("add");
					expect(spy1.calls.argsFor(0).length).toBe(1);
					expect(spy1.calls.argsFor(0)[0]).toBeOfType("object");
				});
				it("passes properties as part of event object to callback", function () {
					scene.on("add", spy1);
					scene.trigger("add", {ABCDEFG: "passed property"});
					var e = spy1.calls.argsFor(0)[0];
					expect(e.ABCDEFG).toBe("passed property");
				});
				it("passes default properties in event object to callback", function () {
					scene.on("add.namespace", spy1);
					scene.trigger("add");
					var e = spy1.calls.argsFor(0)[0];
					expect(e.type).toBe("add");
					expect(e.target).toBe(scene);
					expect(e.currentTarget).toBe(scene);
					expect(e.namespace).toBe("namespace");
					expect(e.timestamp).not.toBeUndefined();
					expect(e.timeStamp).not.toBeUndefined();
				});
			});


			describe (".off()", function () {
				// removing
				it("removes all callbacks", function () {
					scene.on("add", spy1);
					scene.on("add", spy1);
					scene.on("add", spy1);
					scene.on("add", spy2);
					scene.off("add");
					scene.trigger("add");
					expect(spy1).not.toHaveBeenCalled();
					expect(spy2).not.toHaveBeenCalled();
				});
				it("removes a specific callback", function () {
					scene.on("add", spy1);
					scene.on("add", spy1);
					scene.on("add", spy1);
					scene.on("add", spy2);
					scene.off("add", spy1);
					scene.trigger("add");
					expect(spy1).not.toHaveBeenCalled();
					expect(spy2).toHaveBeenCalled();
				});
				it("removes a multiple listeners", function () {
					scene.on("add", spy1);
					scene.on("remove", spy1);
					scene.trigger("add remove");
					expect(spy1).not.toHaveBeenCalled();
				});
				it("removes specific listeners with a specific namespace", function () {
					scene.on("add", spy1);
					scene.on("add.namespace", spy2);
					scene.off("add.namespace");
					scene.trigger("add");
					expect(spy1).toHaveBeenCalled();
					expect(spy2).not.toHaveBeenCalled();
				});
				it("removes all listeners, except the ones with a namespace", function () {
					// this is special behavior due to how events are managed internally
					scene.on("add", spy1);
					scene.on("add.namespace", spy2);
					scene.off("add");
					scene.trigger("add");
					expect(spy1).not.toHaveBeenCalled();
					expect(spy2).toHaveBeenCalled();
				});
				it("removes specific listeners, including the ones with any namespace", function () {
					scene.on("add", spy1);
					scene.on("add.namespace1", spy1);
					scene.on("add.namespace2", spy1);
					scene.on("test.namespace3", spy1);
					scene.on("test.namespace4", spy1);
					scene.on("test.namespace5", spy2);
					scene.on("remove", spy3);
					scene.off("add.*");
					scene.off("test.*", spy1);
					scene.trigger("add");
					scene.trigger("test");
					scene.trigger("remove");
					expect(spy1).not.toHaveBeenCalled();
					expect(spy2).toHaveBeenCalled();
					expect(spy3).toHaveBeenCalled();
				});
				it("removes all listeners with a specific namespace", function () {
					scene.on("add", spy1);
					scene.on("add.namespace", spy2);
					scene.on("remove.namespace", spy2);
					scene.off("*.namespace");
					scene.trigger("add");
					scene.trigger("remove");
					expect(spy1).toHaveBeenCalled();
					expect(spy2).not.toHaveBeenCalled();
				});
				it("removes all listeners, except the ones with a namespace", function () {
					scene.on("add", spy1);
					scene.on("add.namespace", spy2);
					scene.on("remove.namespace", spy2);
					scene.off("*");
					scene.trigger("add");
					scene.trigger("remove");
					expect(spy1).not.toHaveBeenCalled();
					expect(spy2).toHaveBeenCalled();
				});
				it("removes all listeners, including the ones with a namespace", function () {
					scene.on("add", spy1);
					scene.on("add.namespace", spy1);
					scene.on("remove.namespace1", spy1);
					scene.on("remove.namespace2", spy1);
					scene.off("*.*");
					scene.trigger("add");
					scene.trigger("remove");
					expect(spy1).not.toHaveBeenCalled();
				});
			});

		});

		it("should trigger only 'enter' and 'start' for a zero duration scene", function() {
			var scene = new ScrollMagic.Scene(
				{
					triggerElement: "#trigger",
					duration: 0
				})
				.addTo(ctrl);

			var events = ["enter", "leave", "start", "end"];
			var spy = {};
			events.forEach(function(val, i) {
				spy[val] = jasmine.createSpy(val);
				scene.on(val, spy[val]);
			});

			$c.scrollTop(200);
			ctrl.update(true);

			expect(spy.enter).toHaveBeenCalled();
			expect(spy.start).toHaveBeenCalled();
			expect(spy.end).not.toHaveBeenCalled();
			expect(spy.leave).not.toHaveBeenCalled();

		});

		it('should trigger enter 2x for zero duration scenes', function() {
			var scene = new ScrollMagic.Scene(
				{
					triggerElement: "#trigger",
					duration: 0
				})
				.addTo(ctrl);

			var triggerSpy = jasmine.createSpy('triggerSpy');
			scene.on("enter", triggerSpy);

			var moveTop = function(){$c.scrollTop(0);};
			var moveMid = function(){$c.scrollTop(155);};

			moveMid();
			ctrl.update(true);
			moveTop();
			ctrl.update(true);
			moveMid();
			ctrl.update(true);
			expect(triggerSpy).toHaveBeenCalled();
			expect(triggerSpy.calls.count()).toBe(2);
		});

	});
});