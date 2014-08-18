describe('ScrollMagic', function() {

	var $c;
	beforeEach(function() {
		loadFixtures('overflow-scroll.html');
		$c = $('#scroll-container');
	});

	it("should return the correct scroll position", function() {
		var controller = new ScrollMagic({container: $c});
		$c.scrollTop(100);
		expect(controller.scrollPos()).toEqual(100);
	});

	describe(".scrollTo()", function () {
		it("should scroll to a numerical offset", function () {
			var controller = new ScrollMagic({container: $c});
			controller.scrollTo(100);
			expect(controller.scrollPos()).toEqual(100);
		});

		it("should scroll to a certain scrollScene", function () {
			var controller = new ScrollMagic({container: $c});
			var scene = new ScrollScene({offset: 150}).addTo(controller);
			controller.scrollTo(scene);
			expect(controller.scrollPos()).toEqual(150);
		});

		it("should be replaceable with an alternate function", function (done) {
			var controller = new ScrollMagic({container: $c});
			controller.scrollTo(function(newpos){
				$c.animate({scrollTop: newpos}, 500, null, function() {
					expect(controller.scrollPos()).toEqual(150);
				});
			});
			controller.scrollTo(150);
			setTimeout(done, 600);
		});

	});

});