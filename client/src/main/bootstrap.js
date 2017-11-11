var GameService = require('./game-service');
var PlayGameTask = require('./play-game-task');
var GameWidget = require('./game-widget');

var failFast = require('./fail-fast');

failFast.crashOnUnhandledException();
failFast.crashOnResourceLoadingError();

$(document).ready(startApplication());

function startApplication() {
	var container = $('.inner-container');

	var task = PlayGameTask.start(GameService.create());
	GameWidget.render(container, task);
}
