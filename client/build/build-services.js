(function() {
	"use strict";
	
	var path = require('path');
	var phantomjsPath = require('phantomjs').path;
	var backgroundService = require('./background-service');
	
	exports.startPhantomJsWebdriver = function (taskDoneCallback) {
        var webdriverPhantomJS = {
            name: "PhantomJS Webdriver process",
            executable: phantomjsPath,
            arguments: [
                '--webdriver=8185',
                '--webdriver-logfile=build/phantomjs.log'
            ],
            readyPattern: /running on port [0-9]+/
        };

        backgroundService.launchServiceProcess(webdriverPhantomJS, taskDoneCallback);
    };
	
	exports.startServer = function (done) {
		var serverFiles = getServerFiles();
		
		var server = {
			name: 'Question game server',
			executable: 'node',
			arguments: [
				serverFiles.script,
				'-w', serverFiles.clientDirectory,
				'-q', serverFiles.questionFile
			],
			readyPattern: /Serving directory/
		};
		
		backgroundService.launchServiceProcess(server, done);
	};
	
	function getServerFiles() {
		var basePath = path.normalize(path.join(__dirname, '..', '..'));
		
		return {
			script: path.join(basePath, 'server', 'server.js'),
			questionFile: path.join(basePath, 'questions.json'),
			clientDirectory: path.join(basePath, 'client', 'target', 'dist')
		};
	}
	
	exports.startKarmaServer = function (done) {
		var karmaServer = {
            name: "Karma Server",
            executable: 'sh',
            arguments: [
				"-c",
				"node_modules/karma/bin/karma start build/karma.conf.js"
			],
            env: {
                "PHANTOMJS_BIN": phantomjsPath
            },
            readyPattern: /Connected on socket/
        };

        backgroundService.launchServiceProcess(karmaServer, done);
	};
}());