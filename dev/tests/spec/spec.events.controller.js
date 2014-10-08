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

	it("triggers onChange on container resize", function(done) {
		// onchange updates the viewport size - so check if it does.
		var height = ctrl.info("size");
		$c.height(height + 100);
		setTimeout(function () {
			expect(ctrl.info("size")).toBe(height + 100);
			done();
		}, 101); //100 is default refresh interval
	});

	it("triggers onChange on container scroll", function(done) {
		var scene = new ScrollScene().addTo(ctrl);
		spyOn(scene, "update");
		window.requestAnimationFrame(function () {
			// update is also called after adding... so wait a little more
			$c.scrollTop(50);
			window.requestAnimationFrame(function () {
				expect(scene.update).toHaveBeenCalled();
				expect(scene.update.calls.count()).toBe(2);
				done();
			});
		});
	});

});