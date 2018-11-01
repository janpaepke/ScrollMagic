// Karma configuration
module.exports = function(config) {
  var configuration = {
    basePath: '../../',
    frameworks: ['jasmine', 'requirejs'],

    // needed files
    files: [
      // libs
      {included: false, pattern: 'assets/js/lib/**/*.js'},
      // additional libs & settings
      {included: false, pattern: 'dev/tests/karma/**/*.js'},
      // fixtures
      {included: false, pattern: 'dev/tests/fixtures/*.html'},
      // scrollmagic
      {included: false, pattern: 'scrollmagic/uncompressed/**/*.js'},
      // specs
      {included: false, pattern: 'dev/tests/spec/**/*.js'},
      // main file to bootstrap tests
      'dev/tests/main.js',
    ],

    // list of files to exclude
    exclude: [
        '**/karma.conf.js'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    reporters: ['progress'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    singleRun: false
  };

  if(process.env.TRAVIS){
    configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);
};
