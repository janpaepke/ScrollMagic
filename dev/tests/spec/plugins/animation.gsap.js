define(["ScrollMagic", "TweenMax", "ScrollMagic/animation.gsap"], function (ScrollMagic, TweenMax) {
	describe("", function() {
		xit("has method 'setTween'", function () {
			
		});
	});

	describe("Scene", function () {
		beforeEach(function() {
			// disable internal logging
			spyOn(ScrollMagic._util, "log");//.and.callThrough();
			// default setup
			loadFixtures('container-scroll.html');
			$c = $('#scroll-container');
			ctrl = new ScrollMagic.Controller({
				refreshInterval: 9,
				container: $c[0]
			});
			scene = new ScrollMagic.Scene({
				triggerHook: "onLeave",
				triggerElement: "#trigger",
				duration: 100
			}).addTo(ctrl);
		});
		describe(".tweenChanges()", function () {
			it("returns the correct value", function () {
				expect(scene.tweenChanges()).toBe(false);
				expect(new ScrollMagic.Scene({tweenChanges: true}).tweenChanges()).toBe(true);
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
	});
});