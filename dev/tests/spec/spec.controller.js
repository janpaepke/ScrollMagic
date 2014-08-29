describe('ScrollMagic', function() {

	$(window).height(300);
	var $c;
	beforeEach(function() {
		loadFixtures('container-scroll.html');
		$c = $('#scroll-container');
	});

	it("should return the correct scroll position", function() {
		var controller = new ScrollMagic({container: $c});
		$c.scrollTop(100);
		expect(controller.scrollPos()).toEqual(100);
	});

	describe("all methods", function () {
		var getterSetter = ["loglevel", "scrollPos", "enabled"];
		var getterOnly = ["info"];
		var exception = ["destroy"];
		var controller = new ScrollMagic({container: $c, loglevel: 0});
		it(" should be chainable if not a getter", function () {
			for (var m in controller) {
				if (exception.indexOf(m) < 0) {
					var isGetter = getterSetter.indexOf(m) > -1 || getterOnly.indexOf(m) > -1;
					var isSetter = getterOnly.indexOf(m) < 0;
					// call with out a param
					var get = controller[m]();
					var set = controller[m]("1");
					if (isGetter) {
						expect(get).not.toBe(controller);
					} else {
						expect(get).toBe(controller);
					}
					if (isSetter) {
						expect(set).toBe(controller);
					} else {
						expect(set).not.toBe(controller);
					}
				}
			}
		});
	});

	describe(".addScene()", function () {
		it("should add a new scene", function () {
			var controller = new ScrollMagic({container: $c});
			var scene = new ScrollScene();
			spyOn(scene, 'addTo');
			controller.addScene(scene);
			expect(scene.addTo).toHaveBeenCalledWith(controller);
		});
		it("should add multiple scenes as an array", function () {
			var controller = new ScrollMagic({container: $c});
			var scenes = [];
			var addTo = jasmine.createSpy("addTo");
			for (var i = 0; i<10; i++) {
				scenes[i] = new ScrollScene();
				scenes[i].addTo = addTo;
				controller.addScene(scenes[i]);
			}
			expect(addTo.calls.count()).toEqual(10);
		});
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