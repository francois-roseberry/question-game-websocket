
(function() {
	"use strict";
	
	var FakeGameService = require('./fake-game-service');
	var GameWidget = require('./game-widget');
	var GameTask = require('./play-game-task');
	
	var i18n = require('./i18n').i18n();
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
		
		it('renders an error message if name is rejected', function () {
			gameService.rejectNextName();
			domContext.enterTextIn('.txt-player-name', 'player1');
			domContext.clickOn('.btn-join-game');
			domContext.assertOneOf('.name-error');
		});
		
		it('renders an observer button', function () {
			domContext.assertOneOf('.btn-observer');
		});
		
		it('when clicking the observer button, task status becomes players', function () {
			domContext.clickOn('.btn-observer');
			expect(currentStatus.name).to.eql('players');
		});
		
		describe('when player is observer', function () {
			beforeEach(function () {
				task.setObserver();
			});
			
			describe('when empty player list if received', function () {
				beforeEach(function () {
					gameService.sendPlayerList([]);
				});
				
				it('does not render a player list', function () {
					domContext.assertNothingOf('.players');
				});
				
				it('renders a no player message', function () {
					domContext.assertOneOf('.no-player');
				});
			});
			
			var players = ['bob', 'alice', 'george'];
			
			it('if game service receive results, renders a players list', function () {
				task.setObserver();
				gameService.sendPlayerList(players);
				
				domContext.assertOneOf('.players');
				domContext.assertElementCount('.player', players.length);
				
				_.each(players, function (player) {
					domContext.assertText('.player [data-player=' + player + ']',
						player);
				});
			});
			
			describe('after receiving results', function () {
				var result = { choice: 'alibaba', authors: ['bob'], choosedBy: ['alice', 'george']};
				
				beforeEach(function () {
					gameService.sendResult(result);
				});
				
				it('renders the choice label', function () {
					domContext.assertOneOf('.result-choice');
					domContext.assertText('.result-choice',
						i18n.RESULT_CHOICE.replace('{choice}', result.choice));
				});
				
				it('renders the list of authors', function () {
					domContext.assertOneOf('.result-authors');
					
					_.each(result.authors, function (author) {
						domContext.assertOneOf('.result-author[data-author=' + author + ']');
						
						if (author === 'TRUTH') {
							domContext.assertCssClass('.result-author[data-author=' + author + ']', 'result-truth');
							domContext.assertText('.result-author[data-author=' + author + ']',
								i18n.RESULT_CHOICE_TRUTH);
						} else {
							domContext.assertCssClass('.result-author[data-author=' + author + ']', 'result-lie');
							domContext.assertText('.result-author[data-author=' + author + ']',
								i18n.RESULT_CHOICE_LIE.replace('{author}', author));
						}
					});
				});
				
				it('renders the list of who choosed it', function () {
					domContext.assertOneOf('.result-choosers');
					
					_.each(result.choosedBy, function (chooser) {
						domContext.assertOneOf('.result-chooser[data-chooser=' + chooser + ']');
					});
				});
			});
			
			describe('after receiving scores', function () {
				var scores = [
					{name: 'bob', score: 0},
					{name: 'alice', score: 1000},
					{name: 'george', score: 500}
				];
				beforeEach(function () {
					gameService.sendScores(scores);
				});
				
				it('renders a score header', function () {
					domContext.assertOneOf('.scores-header');
				});
				
				it('renders a scores list', function () {
					domContext.assertOneOf('.scores');
				});
				
				it('renders a score element for each score', function () {
					domContext.assertElementCount('.score', scores.length);
					
					_.each(scores, function (score) {
						domContext.assertText('.score[data-player=' + score.name + '] .score-name',
							score.name);
							
						domContext.assertText('.score[data-player=' + score.name + '] .score-value',
							score.score + '');
					});
				});
			});
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
			
			it('when starting game and player is observer, does not render cancel button', function () {
				task.setObserver();
				task.startGame();
				domContext.assertNothingOf('.btn-cancel');
			});
			
			describe('after starting game and player is not observer', function () {
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
				
				it('when question is received and player is observer, ' +
					'does not render answer box and button', function () {
						task.setObserver();
						gameService.sendQuestion('2 + 2 = ?');
						domContext.assertNothingOf('.txt-answer');
						domContext.assertNothingOf('.btn-submit-answer');
					});
				
				describe('after question is received', function () {
					beforeEach(function () {
						gameService.sendQuestion('2 + 2 = ?');
					});
					
					it('removes the starting game controls', function () {
						domContext.assertNothingOf('.game-starting');
						domContext.assertNothingOf('.btn-cancel');
					});
					
					it('renders a text containing question number', function () {
						domContext.assertOneOf('.question-number');
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
					
					it('enables its answer button when there is a player name entered', function () {
						domContext.enterTextIn('.txt-answer', 'something');
						domContext.assertEnabled('.btn-submit-answer');
					});
					
					it('renders an error message if answer is rejected', function () {
						gameService.rejectNextAnswer();
						domContext.enterTextIn('.txt-answer', '5');
						domContext.clickOn('.btn-submit-answer');
						domContext.assertOneOf('.answer-error');
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