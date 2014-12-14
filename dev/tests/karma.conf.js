// Karma configuration
module.exports = function(config) {
  var configuration = {
    basePath: '',
    frameworks: ['jasmine'],

    // needed files
    files: [
      {pattern: 'fixtures/*.html', included: false},
      '../../js/lib/jquery.min.js',
      '../../js/lib/greensock/TweenMax.min.js',
      '../../scrollmagic/uncompressed/ScrollMagic.js',
      '../../scrollmagic/uncompressed/plugins/scene.addIndicators.js',
      'karma/vendor/**/*.js',
      'karma/settings.js',
      'spec/*.js'
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
