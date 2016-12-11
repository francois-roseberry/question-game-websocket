
(function() {
	"use strict";
	
	var FakeGameService = require('./fake-game-service');
	var GameWidget = require('./game-widget');
	var GameTask = require('./play-game-task');
	
	var describeInDom = require('./dom-fixture').describeInDom;
	
	describeInDom('A Game widget', function (domContext) {
		var task;
		var gameService;
		var currentStatus;
		
		beforeEach(function () {
			gameService = FakeGameService.create();
			task = GameTask.start(gameService);
			task.status().subscribe(function (status) {
				currentStatus = status;
			});
			GameWidget.render(domContext.rootElement, task);
		});
		
		it('renders a label for the name', function () {
			domContext.assertOneOf('.lbl-player-name');
		});
			
		it('renders a text box for inputting the name', function () {
			domContext.assertOneOf('.txt-player-name');
		});
		
		it('renders a join button', function () {
			domContext.assertOneOf('.btn-join-game');
		});
		
		it('disables join button at start', function () {
			domContext.assertDisabled('.btn-join-game');
		});
		
		it('enables its join button when there is a player name entered', function () {
			domContext.enterTextIn('.txt-player-name', 'something');
			domContext.assertEnabled('.btn-join-game');
		});
		
		describe('after player name is submitted', function () {
			beforeEach(function () {
				domContext.enterTextIn('.txt-player-name', 'player1');
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
					
					expect(currentStatus.name).to.eql('before');
				});
				
				describe('after question is received', function () {
					beforeEach(function () {
						gameService.sendQuestion('2 + 2 = ?');
					});
					
					it('removes the starting game controls', function () {
						domContext.assertNothingOf('.game-starting');
						domContext.assertNothingOf('.btn-cancel');
					});
					
					it('renders a text containing the question', function () {
						domContext.assertOneOf('.question');
					});
					
					it('renders an answer box', function () {
						domContext.assertOneOf('.txt-answer');
					});
					
					it('renders a submit answer button', function () {
						domContext.assertOneOf('.btn-submit-answer');
					});
					
					it('disables answer button at start', function () {
						domContext.assertDisabled('.btn-submit-answer');
					});
					
					it('enables its join button when there is a player name entered', function () {
						domContext.enterTextIn('.txt-answer', 'something');
						domContext.assertEnabled('.btn-submit-answer');
					});
					
					describe('after answer is submitted', function () {
						beforeEach(function () {
							domContext.enterTextIn('.txt-answer', '5');
							domContext.clickOn('.btn-submit-answer');
						});
						
						it('removes the question controls', function () {
							domContext.assertNothingOf('.question');
							domContext.assertNothingOf('.txt-answer');
							domContext.assertNothingOf('.btn-submit-answer');
						});
						
						it('renders a text telling to wait for others', function () {
							domContext.assertOneOf('.waiting');
						});
						
						describe('after choices are received', function () {
							var choices = ['2','3','4','5'];
							beforeEach(function () {
								gameService.sendChoices(choices);
							});
							
							it('removes the waiting text', function () {
								domContext.assertNothingOf('.waiting');
							});
							
							it('renders a button per choice', function () {
								domContext.assertElementCount('.btn-choice', choices.length);
								_.each(choices, function (choice, index) {
									domContext.assertOneOf('.btn-choice[data-index=' + index + ']');
								});
							});
							
							describe('after clicking on a choice', function () {
								beforeEach(function () {
									domContext.clickOn('.btn-choice[data-index=0]');
								});
								
								it('returns to a waiting status', function () {
									expect(currentStatus.name).to.eql('waiting');
								});
							});
						});
					});
				});
			});
		});
	});
}());