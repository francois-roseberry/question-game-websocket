
(function() {
	"use strict";
	
	var GameWidget = require('./game-widget');
	var GameTask = require('./play-game-task');
	
	var describeInDom = require('./dom-fixture').describeInDom;
	
	describeInDom('A Game widget', function (domContext) {
		var task;
		var currentStatus;
		
		beforeEach(function () {
			task = GameTask.start();
			task.status().subscribe(function (status) {
				currentStatus = status;
			});
			GameWidget.render(domContext.rootElement, task);
		});
			
		it('renders a text box for inputting the name', function () {
			domContext.assertOneOf('.txt-player-name');
		});
		
		it('renders a join button', function () {
			domContext.assertOneOf('.btn-join-game');
		});
		
		describe('after player name is submitted', function () {
			beforeEach(function () {
				domContext.enterTextIn('.txt-player-name', 'Joueur');
				domContext.clickOn('.btn-join-game');
			});
			
			it('removes the name box and join button', function () {
				domContext.assertNothingOf('.txt-player-name');
				domContext.assertNothingOf('.btn-join-game');
			});
			
			it('renders a start game button', function () {
				domContext.assertOneOf('.btn-start-game');
			});
			
			describe('after starting game', function () {
				beforeEach(function () {
					task.startGame();
				});
				
				it('removes the start game button', function () {
					domContext.assertNothingOf('.btn-start-game');
				});
				
				it('renders a text telling the game is gonna start soon', function () {
					domContext.assertOneOf('.game-starting');
				});
				
				it('renders a cancel button', function () {
					domContext.assertOneOf('.btn-cancel');
				});
				
				it('clicking on the cancel button cancels the game', function () {
					domContext.clickOn('.btn-cancel');
					
					expect(currentStatus.name).to.eql('waiting');
				});
			});
		});
	});
}());