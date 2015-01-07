define(["ScrollMagic"], function (ScrollMagic) {
	describe("pure module", function() {
		it("has no method 'setTween'", function () {
			expect(new ScrollMagic.Scene().setTween).toBeUndefined();
		});
	});
});