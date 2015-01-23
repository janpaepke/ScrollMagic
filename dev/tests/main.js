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

// prepare test env
require.config({
	baseUrl: '/base',
	paths: {
		// libs
		"jquery": "js/lib/jquery.min",
		"jasmine-jquery": "dev/tests/karma/vendor/jasmine-jquery",
		// settings
		"jasmine-matchers": "dev/tests/karma/jasmine.matchers"
	},
	shim: {
		'jasmine-jquery': ['jquery']
	},

	deps: [
		// matchers
		'jasmine-matchers',

		// libs
		'jquery',
		'jasmine-jquery'
	],

	callback: function (globalMatchers) {
		// prepare fixtures
		jasmine.getFixtures().fixturesPath = '/base/dev/tests/fixtures';
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
				"jquery": "js/lib/jquery.min",
				"velocity": "js/lib/velocity.min",
				"TweenLite": "js/lib/greensock/TweenLite.min",
				"TweenMax": "js/lib/greensock/TweenMax.min",
				"TimelineLite": "js/lib/greensock/TimelineLite.min",
				"TimelineMax": "js/lib/greensock/TimelineMax.min"
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

			deps: [tests[i]],

			callback: function () {
				if (++loaded === tests.length) {
					window.__karma__.start();
				}
			}
		});
	}
}