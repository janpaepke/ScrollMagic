describe('ScrollScene', function() {

	var log = console.log; // loging from jasmine
	var $c;			// container
	var ctrl;		// controller
	var scene;	// scene

	beforeEach(function() {
		// disable internal logging
		spyOn(console, "log");
		spyOn(console, "warn");
		spyOn(console, "error");
		// default setup
		loadFixtures('container-scroll.html');
		$c = $('#scroll-container');
		ctrl = new ScrollMagic({container: $c});
		scene = new ScrollScene().addTo(ctrl);
	});

	describe("constructor", function () {
	});

	describe("every method", function () {
		var getterSetter = ["duration", "offset", "triggerElement", "triggerHook", "reverse", "tweenChanges", "loglevel", "enabled", "progress"];
		var getterOnly = ["parent", "state", "scrollOffset", "triggerOffset"];
		if (new ScrollScene().triggerPosition) {
			getterOnly.push("triggerPosition") // deprecated since 1.1.0
		} else {
			log("remove test for triggerPosition!");
		}
		var exception = ["destroy"];
		if (new ScrollScene().updateIndicators) {
			exception.push("updateIndicators")
		} else {
			log("remove test for updateIndicators!");
		}
		it("is chainable if not a getter", function () {
			var matchers = {
				toBeChainableSetter: function(util, customEqualityTesters) {
					return {
						compare: function(method, obj) {
							var result = {};
							try {
								result.pass = obj[method]("1") === obj;
							} catch (e) {
								result.pass = false;
							}
							if (result.pass) {
								result.message = "Expected method '" + method + "' not to be chainable when used as setter";
							} else {
								result.message = "Expected method '" + method + "' to be chainable when used as setter";
							}
						 return result;
						}  
					}
				},
				toBeGetter: function(util, customEqualityTesters) {
					return {
						compare: function(method, obj) {
							var result = {};
							try {
								result.pass = obj[method]() !== obj;
							} catch (e) {
								result.pass = false;
							}
							if (result.pass) {
								result.message = "Expected method '" + method + "' not to be a getter";
							} else {
								result.message = "Expected method '" + method + "' to be a getter";
							}
						 return result;
						}  
					}
				}
			};
			jasmine.addMatchers(matchers);
			for (var m in scene) {
				if (typeof scene[m] === 'function' && exception.indexOf(m) < 0) {
					if (getterSetter.indexOf(m) > -1 || getterOnly.indexOf(m) > -1) { // is getter
						expect(m).toBeGetter(scene);
					} else {
						expect(m).not.toBeGetter(scene);
					}
					if (getterOnly.indexOf(m) == -1) { // can be used as setter
						expect(m).toBeChainableSetter(scene);
					} else {
						expect(m).not.toBeChainableSetter(scene);
					}
				}
			}
		});
	});



});