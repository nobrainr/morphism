var webpackConf = require('./webpack.config.js');
module.exports = function (config) {
  config.set({
    basePath:'',
    frameworks: ['jasmine'],
    files: [{ pattern: './tests/unit/spec-bundle.js', watched: false }],
    preprocessors: { './tests/unit/spec-bundle.js': ['coverage', 'webpack', 'sourcemap'] },
    webpack: {
      module: webpackConf.module,
      resolve: webpackConf.resolve
    },
    webpackMiddleware: {
      noInfo: true,
      stats: 'errors-only'
    },
    reporters: ['kjhtml', 'spec', 'coverage'],
    // optionally, configure the reporter
    coverageReporter: {
      // specify a common output directory
      dir: './tests/build/reports/coverage',
      reporters: [
        // reporters not supporting the `file` property
        { type: 'html', subdir: 'report-html' },
        { type: 'lcov', subdir: 'report-lcov' },
        // reporters supporting the `file` property, use `subdir` to directly
        // output them in the `dir` directory
        { type: 'cobertura', subdir: '.', file: 'cobertura.txt' },
        { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' },
        { type: 'teamcity', subdir: '.', file: 'teamcity.txt' },
        { type: 'text', subdir: '.', file: 'text.txt' },
        { type: 'text-summary', subdir: '.', file: 'text-summary.txt' },
      ]
    },
    specReporter: {
      maxLogLines: 5,         // limit number of lines logged per test 
      suppressErrorSummary: true,  // do not print error summary 
      suppressFailed: false,  // do not print information about failed tests 
      suppressPassed: false,  // do not print information about passed tests 
      suppressSkipped: true,  // do not print information about skipped tests 
      showSpecTiming: false // print the time elapsed for each spec 
    },
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: true,
    concurrency: Infinity
  });


  if (process.env.TRAVIS) {
    config.browsers = ['Chrome_travis_ci'];
  }
};
