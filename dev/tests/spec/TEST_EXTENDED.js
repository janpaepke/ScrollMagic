define(["ScrollMagic", "ScrollMagic/animation.gsap"], function (ScrollMagic) {
	describe("extended module", function() {
		it("has method 'setTween'", function () {
			expect(new ScrollMagic.Scene().setTween).toBeDefined();
		});
	});
});