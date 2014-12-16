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
];

require.config({
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
			main: "ScrollMagic",
			location: "scrollmagic/uncompressed"
		}
	],

	deps: tests,

	callback: function(globalMatchers) {
		jasmine.getFixtures().fixturesPath = '/base/dev/tests/fixtures';
		beforeEach(function() {
			jasmine.addMatchers(globalMatchers.methodTests);
		});
		window.__karma__.start();
	}
});