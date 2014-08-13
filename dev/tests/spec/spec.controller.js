describe('ScrollMagic', function() {

	beforeEach(function() {
		loadFixtures('overflow-scroll.html');
	});

	it("should return the correct scroll position", function() {
		$el = $('#scroll-container');
		var controller = new ScrollMagic({container: $el});
		$el.scrollTop(100);
		expect(controller.scrollPos()).toEqual(100);
	});

});