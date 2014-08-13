// Karma configuration
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],

    // needed files
    files: [
      {pattern: 'fixtures/*.html', included: false},
      '../../js/_dependent/jquery.min.js',
      '../../js/_dependent/greensock/TweenMax.min.js',
      '../../js/jquery.scrollmagic.js',
      '../../js/jquery.scrollmagic.debug.js',
      'additional/vendor/**/*.js',
      'additional/settings.js',
      'spec/*.js'
    ],

    // list of files to exclude
    exclude: [
      'spec/_*.js'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    reporters: ['progress'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};
