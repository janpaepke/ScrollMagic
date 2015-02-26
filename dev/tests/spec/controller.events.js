define(["ScrollMagic"], function (ScrollMagic) {

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
				$c.height(200);
			}, 110); // 100 is default val for refresh interval + some execution time...
			setTimeout(function(){
				expect(resizeSpy).toHaveBeenCalled();
				expect(resizeSpy.calls.count()).toBe(2);
				done();
			}, 220); // 100 is default val for refresh interval + some execution time...
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
			window.requestAnimationFrame(function () { // update is also called after adding... so await first cycle
				spyOn(scene, "update");
				$c[0].dispatchEvent(new Event('scroll'));
				window.requestAnimationFrame(function () {
					expect(scene.update).toHaveBeenCalled();
					done();
				});
			});
		});

	});
});