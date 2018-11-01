// all spec files to run
var tests = [
	// modules
	'spec/_util',
	'spec/controller',
	'spec/scene',
	// events
	'spec/controller.events',
	'spec/scene.events',
	// plugins
	'spec/plugins/animation.gsap',
	'spec/plugins/animation.velocity',
	'spec/plugins/debug.addIndicators',
	'spec/plugins/jquery.ScrollMagic',
];

var specDeps = [
	'jquery',
	'jasmine-jquery'
];

// prepare test env - global settings
require.config({
	baseUrl: '/base',
	paths: {
		// settings
		"jasmine-matchers": "dev/tests/karma/jasmine.matchers"
	},
	deps: [
		// matchers
		'jasmine-matchers',
	],
	callback: function (globalMatchers) {
		// set global matchers
		beforeEach(function() {
			jasmine.addMatchers(globalMatchers.methodTests);
		});
		// init test loading
		loadTests();
	}
});

// start loading tests
// load each to individual context to avoid module pollution through plugins
function loadTests() {

	var loaded = 0;
	for (var i = 0; i<tests.length; i++) {
		require.config({
			context: tests[i],
			baseUrl: '/base',
			paths: {
				// specs
				"spec": "dev/tests/spec",
				// libs
				"velocity": "assets/js/lib/velocity.min",
				"TweenLite": "assets/js/lib/greensock/TweenLite.min",
				"TweenMax": "assets/js/lib/greensock/TweenMax.min",
				"TimelineLite": "assets/js/lib/greensock/TimelineLite.min",
				"TimelineMax": "assets/js/lib/greensock/TimelineMax.min",
				"jquery": "assets/js/lib/jquery.min",
				"jasmine-jquery": "dev/tests/karma/vendor/jasmine-jquery"
			},
			shim: {
				'jasmine-jquery': ['jquery']
			},
			packages: [
				{
					name: "ScrollMagic",
					main: "../ScrollMagic",
					location: "scrollmagic/uncompressed/plugins"
				}
			],
			map : {
				'*' : {
					// use lite instead of max?
					// "TweenMax": "TweenLite",
					// "TimelineMax": "TimelineLite"
				}
			},

			deps: specDeps.concat(tests[i]),

			callback: function () {
				if (++loaded === tests.length) {
					// prepare fixtures
					jasmine.getFixtures().fixturesPath = '/base/dev/tests/fixtures';
					// start runner
					window.__karma__.start();
				}
			}
		});
	}
}
