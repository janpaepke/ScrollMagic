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


	it("triggers container resize event", function(done) {
		var resizeSpy = jasmine.createSpy('resizeSpy');
		$c.height(300);
		$c.on("resize", resizeSpy);
		setTimeout(function(){
			expect(resizeSpy).toHaveBeenCalled();
			done();
		}, 101); // 100 is default val for refresh interval
	});

	it("calls onChange on container resize", function(done) {
		// onchange updates the viewport size - so check if it does.
		var height = ctrl.info("size");
		$c.height(height + 100);
		setTimeout(function () {
			expect(ctrl.info("size")).toBe(height + 100);
			done();
		}, 101); //100 is default refresh interval
	});

	it("calls onChange on container scroll", function(done) {
		var scene = new ScrollMagic.Scene().addTo(ctrl);
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