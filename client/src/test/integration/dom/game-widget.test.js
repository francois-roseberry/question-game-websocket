var FakeGameService = require('./fake-game-service');
var GameWidget = require('./game-widget');
var GameTask = require('./play-game-task');

var i18n = require('./i18n').i18n();
var describeInDom = require('./dom-fixture').describeInDom;

describeInDom('A Game widget', domContext => {
	var task;
	var gameService;
	var currentStatus;

	beforeEach(() => {
		gameService = FakeGameService.create();
		task = GameTask.start(gameService);
		task.status().subscribe(status => {
			currentStatus = status;
		});
		GameWidget.render(domContext.rootElement, task);
	});

	it('renders a label for the name', () => {
		domContext.assertOneOf('.lbl-player-name');
	});

	it('renders a text box for inputting the name', () => {
		domContext.assertOneOf('.txt-player-name');
	});

	it('renders a join button', () => {
		domContext.assertOneOf('.btn-join-game');
	});

	it('disables join button at start', () => {
		domContext.assertDisabled('.btn-join-game');
	});

	it('enables its join button when there is a player name entered', () => {
		domContext.enterTextIn('.txt-player-name', 'something');
		domContext.assertEnabled('.btn-join-game');
	});

	it('renders an error message if name is rejected', () => {
		gameService.rejectNextName();
		domContext.enterTextIn('.txt-player-name', 'player1');
		domContext.clickOn('.btn-join-game');
		domContext.assertOneOf('.name-error');
	});

	it('renders an observer button', () => {
		domContext.assertOneOf('.btn-observer');
	});

	it('when clicking the observer button, task status becomes players', () => {
		domContext.clickOn('.btn-observer');
		expect(currentStatus.name).to.eql('players');
	});

	describe('when game service receives quit', () => {
		var playerName = 'bob';
		beforeEach(() => {
			gameService.rageQuit(playerName);
		});

		it('renders a message telling why game ended', () => {
			domContext.assertOneOf('.player-quit');

			domContext.assertText('.player-quit', i18n.PLAYER_QUIT.replace('{player}', playerName));
		});
	});

	describe('when player is observer', () => {
		beforeEach(() => {
			task.setObserver();
		});

		describe('when empty player list if received', () => {
			beforeEach(() => {
				gameService.sendPlayerList([]);
			});

			it('does not render a player list', () => {
				domContext.assertNothingOf('.players');
			});

			it('renders a no player message', () => {
				domContext.assertOneOf('.no-player');
			});
		});

		var players = ['bob', 'alice', 'george'];

		it('if game service receive results, renders a players list', () => {
			task.setObserver();
			gameService.sendPlayerList(players);

			domContext.assertOneOf('.players');
			domContext.assertElementCount('.player', players.length);

			_.each(players, player => {
				domContext.assertText('.player [data-player=' + player + ']',
					player);
			});
		});

		describe('after receiving results', () => {
			var result = { choice: 'alibaba', authors: ['bob'], choosedBy: ['alice', 'george']};

			beforeEach(() => {
				gameService.sendResult(result);
			});

			it('renders the choice label', () => {
				domContext.assertOneOf('.result-choice');
				domContext.assertText('.result-choice',
					i18n.RESULT_CHOICE.replace('{choice}', result.choice));
			});

			it('renders the list of authors', () => {
				domContext.assertOneOf('.result-authors');

				_.each(result.authors, author => {
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

			it('renders the list of who choosed it', () => {
				domContext.assertOneOf('.result-choosers');

				_.each(result.choosedBy, chooser => {
					domContext.assertOneOf('.result-chooser[data-chooser=' + chooser + ']');
				});
			});
		});

		describe('after receiving scores', () => {
			var scores = [
				{name: 'bob', score: 0},
				{name: 'alice', score: 1000},
				{name: 'george', score: 500}
			];
			beforeEach(() => {
				gameService.sendScores(scores);
			});

			it('renders a score header', () => {
				domContext.assertOneOf('.scores-header');
			});

			it('renders a scores list', () => {
				domContext.assertOneOf('.scores');
			});

			it('renders a score element for each score', () => {
				domContext.assertElementCount('.score', scores.length);

				_.each(scores, score => {
					domContext.assertText('.score[data-player=' + score.name + '] .score-name',
						score.name);

					domContext.assertText('.score[data-player=' + score.name + '] .score-value',
						score.score + '');
				});
			});
		});
	});

	describe('after player name is submitted', () => {
		beforeEach(() => {
			domContext.enterTextIn('.txt-player-name', 'player1');
			domContext.clickOn('.btn-join-game');
		});

		it('removes the name box and join button', () => {
			domContext.assertNothingOf('.txt-player-name');
			domContext.assertNothingOf('.btn-join-game');
		});

		it('renders a start game button', () => {
			domContext.assertOneOf('.btn-start-game');
		});

		it('when starting game and player is observer, does not render cancel button', () => {
			task.setObserver();
			task.startGame();
			domContext.assertNothingOf('.btn-cancel');
		});

		describe('after starting game and player is not observer', () => {
			beforeEach(() => {
				task.startGame();
			});

			it('removes the start game button', () => {
				domContext.assertNothingOf('.btn-start-game');
			});

			it('renders a text telling the game is gonna start soon', () => {
				domContext.assertOneOf('.game-starting');
			});

			it('renders a cancel button', () => {
				domContext.assertOneOf('.btn-cancel');
			});

			it('clicking on the cancel button cancels the game', () => {
				domContext.clickOn('.btn-cancel');

				expect(currentStatus.name).to.eql('before');
			});

			it('when question is received and player is observer, ' +
				'does not render answer box and button', () => {
					task.setObserver();
					gameService.sendQuestion('2 + 2 = ?');
					domContext.assertNothingOf('.txt-answer');
					domContext.assertNothingOf('.btn-submit-answer');
				});

			describe('after question is received', () => {
				beforeEach(() => {
					gameService.sendQuestion('2 + 2 = ?');
				});

				it('removes the starting game controls', () => {
					domContext.assertNothingOf('.game-starting');
					domContext.assertNothingOf('.btn-cancel');
				});

				it('renders a text containing question number', () => {
					domContext.assertOneOf('.question-number');
				});

				it('renders a text containing the question', () => {
					domContext.assertOneOf('.question');
				});

				it('renders an answer box', () => {
					domContext.assertOneOf('.txt-answer');
				});

				it('renders a submit answer button', () => {
					domContext.assertOneOf('.btn-submit-answer');
				});

				it('disables answer button at start', () => {
					domContext.assertDisabled('.btn-submit-answer');
				});

				it('enables its answer button when there is a player name entered', () => {
					domContext.enterTextIn('.txt-answer', 'something');
					domContext.assertEnabled('.btn-submit-answer');
				});

				it('renders an error message if answer is rejected', () => {
					gameService.rejectNextAnswer();
					domContext.enterTextIn('.txt-answer', '5');
					domContext.clickOn('.btn-submit-answer');
					domContext.assertOneOf('.answer-error');
				});

				describe('after answer is submitted', () => {
					beforeEach(() => {
						domContext.enterTextIn('.txt-answer', '5');
						domContext.clickOn('.btn-submit-answer');
					});

					it('removes the question controls', () => {
						domContext.assertNothingOf('.question');
						domContext.assertNothingOf('.txt-answer');
						domContext.assertNothingOf('.btn-submit-answer');
					});

					it('renders a text telling to wait for others', () => {
						domContext.assertOneOf('.waiting');
					});

					describe('after choices are received', () => {
						var choices = ['2','3','4','5'];
						beforeEach(() => {
							gameService.sendChoices(choices);
						});

						it('removes the waiting text', () => {
							domContext.assertNothingOf('.waiting');
						});

						it('renders a button per choice', () => {
							domContext.assertElementCount('.btn-choice', choices.length);
							_.each(choices, (choice, index) => {
								domContext.assertOneOf('.btn-choice[data-index=' + index + ']');
							});
						});

						describe('after clicking on a choice', () => {
							beforeEach(() => {
								domContext.clickOn('.btn-choice[data-index=0]');
							});

							it('returns to a waiting status', () => {
								expect(currentStatus.name).to.eql('waiting');
							});
						});
					});
				});
			});
		});
	});
});
