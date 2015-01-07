var tests = [
	// matchers
	'jasmine-matchers',
	
	// libs
	'jquery',
	'jasmine-jquery',

	// specs
	'spec/_util',
	'spec/controller',
	'spec/controller.events',
	'spec/scene',
	'spec/scene.events',
	'spec/TEST_PURE',
	'spec/TEST_EXTENDED',
];

require.config({
	// urlArgs: "bust=" + (new Date()).getTime(),
	baseUrl: '/base',
	paths: {
		// libs
		"jquery": "js/lib/jquery.min",
		"jasmine-jquery": "dev/tests/karma/vendor/jasmine-jquery",
		// settings
		"jasmine-matchers": "dev/tests/karma/jasmine.matchers",
		// specs
		"spec": "dev/tests/spec",
	},
	packages: [
		{
			name: "ScrollMagic",
			main: "../ScrollMagic",
			location: "scrollmagic/uncompressed/plugins"
		},
		{
			name: "gsap",
			location: "js/lib/greensock"
		}
	],
	map : {
		'*' : {
			"TweenMax": "gsap/TweenLite.min",
			"TimelineMax": "gsap/TimelineMax.min"
		}
	},

	deps: tests,

	callback: function(globalMatchers) {
		jasmine.getFixtures().fixturesPath = '/base/dev/tests/fixtures';
		beforeEach(function() {
			jasmine.addMatchers(globalMatchers.methodTests);
		});
		window.__karma__.start();
	}
});
