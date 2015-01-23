// all spec files to run
var tests = [
	'spec/_util',
	'spec/controller',
	'spec/controller.events',
	'spec/scene',
	'spec/scene.events',
	'spec/TEST_PURE',
	'spec/TEST_EXTENDED',
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