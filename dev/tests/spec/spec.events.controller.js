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

	it("uses TweenMax ticker", function() {
		spyOn(TweenMax.ticker, "addEventListener");
		new ScrollMagic();
		expect(TweenMax.ticker.addEventListener.calls.count()).toBe(1);
	});

	it("uses fallback events if TweenMax ticker is unavailable", function() {
		var tmp = TweenLite;
		TweenLite = undefined;
		var ctrl = new ScrollMagic();
		var scene = new ScrollScene().addTo(ctrl);
		spyOn(scene, "update");
		$c.trigger("resize");
		$c.trigger("scroll");
		expect(scene.update.calls.count()).toBe(3); // once for adding, once for each event
		TweenLite = tmp;
	});

	it("triggers onChange on container resize", function(done) {
		// onchange updates the viewport size - so check if it does.
		var height = ctrl.info("size");
		$c.height(height + 100);
		setTimeout(function () {
			expect(ctrl.info("size")).toBe(height + 100);
			done();
		}, 200);
	});

	it("triggers onChange on container scroll", function(done) {
		var scene = new ScrollScene().addTo(ctrl);
		spyOn(scene, "update");
		setTimeout(function () {
			// update is also called after adding... so wait a little more
			$c.scrollTop(50);
			setTimeout(function () {
				expect(scene.update).toHaveBeenCalled();
				expect(scene.update.calls.count()).toBe(2);
				done();
			}, 50);
		}, 50);
	});

});