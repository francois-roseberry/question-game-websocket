// Karma configuration
"use strict";

var baseConfig = require('./karma.conf.js');

module.exports = function (config) {
  baseConfig(config);

    config.set({
        reporters: ['spec', 'junit'],
        junitReporter: {
          outputDir: 'test-results',
          useBrowserName: false
        },
        singleRun: true
    });
};
