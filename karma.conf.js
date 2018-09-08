var webpackConf = require('./webpack.config.js');
module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [{ pattern: './tests/unit/spec-bundle.js', watched: false }],
        preprocessors: { './tests/unit/spec-bundle.js': ['webpack', 'sourcemap'] },
        webpack: {
            module: webpackConf.module,
            resolve: webpackConf.resolve
        },
        webpackMiddleware: {
            noInfo: true,
            stats: 'errors-only'
        },
        reporters: [ 'spec', 'coverage-istanbul'],
        specReporter: {
            maxLogLines: 5,         // limit number of lines logged per test
            suppressErrorSummary: true,  // do not print error summary
            suppressFailed: false,  // do not print information about failed tests
            suppressPassed: false,  // do not print information about passed tests
            suppressSkipped: true,  // do not print information about skipped tests
            showSpecTiming: false // print the time elapsed for each spec
        },
        coverageIstanbulReporter: {
            reports: ['html', 'lcov', 'text-summary'],
            dir: './tests/coverage', // coverage results needs to be saved under coverage/
            fixWebpackSourcePaths: true,
            query: {
                esModules: true
            }
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
