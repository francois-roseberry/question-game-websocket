(function() {
	"use strict";
	
	var PlayGameTask = require('./play-game-task');
	var GameWidget = require('./game-widget');
	
	var failFast = require('./fail-fast');
	
	failFast.crashOnUnhandledException();
    failFast.crashOnResourceLoadingError();

	$(document).ready(startApplication());

	function startApplication() {
		var container = $('.app-container');

		var task = PlayGameTask.start();
		GameWidget.render(container, task);
	}
}());