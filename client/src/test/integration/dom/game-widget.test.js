
(function() {
	"use strict";
	
	var GameWidget = require('./game-widget');
	var GameTask = require('./play-game-task');
	
	var describeInDom = require('./dom-fixture').describeInDom;
	
	describeInDom('A Game widget', function (domContext) {
		var task;
		
		beforeEach(function () {
			task = GameTask.start();
			GameWidget.render(domContext.rootElement, task);
		});
			
		it('renders a text box for inputting the name', function () {
			domContext.assertOneOf('.txt-player-name');
		});
		
		it('renders a join button', function () {
			domContext.assertOneOf('.btn-join-game');
		});
	});
}());