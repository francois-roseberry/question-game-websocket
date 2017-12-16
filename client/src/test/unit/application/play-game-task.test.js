var FakeGameService = require('./fake-game-service');
var PlayGameTask = require('./play-game-task');

describe('A Play game task', () => {
	var task;
	var gameService;
	var currentStatus;

	beforeEach(() => {
		gameService = FakeGameService.create();
		task = PlayGameTask.start(gameService);
		task.status().subscribe(function(status) {
			currentStatus = status;
		});
	});

	it('has an initial status', () => {
		expect(currentStatus.name).to.eql('initial');
	});

	describe('when user is not logged in', () => {
		it('does not send starting status if game is starting', () => {
			task.startGame();
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send a new status if game service receives player list', () => {
			gameService.sendPlayerList(['bob']);
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send a new status if question is received', () => {
			gameService.sendQuestion('2 + 2 = ?');
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send a new status if choices are received', () => {
			gameService.sendChoices(['2','3','4','5']);
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send a new status if results are received', () => {
			gameService.sendResult({
				choice:'4', authors: ['bob'], choosedBy: ['alice']
			});
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send scores status if scores are received', () => {
			gameService.sendScores([
				{name: 'bob', score: 0},
				{name: 'alice', score: 1000}
			]);
			expect(currentStatus.name).to.eql('initial');
		});

		it('sends a new players status when player becomes observer', () => {
			task.setObserver();
			expect(currentStatus.name).to.eql('players');
		});

		it('if game service rejects the name, keeps the same status', () => {
			gameService.rejectNextName();
			task.setPlayerName('bob');
			expect(currentStatus.name).to.eql('initial');
		});

		it('cannot be named TRUTH', () => {
			task.setPlayerName('TRUTH');
			expect(currentStatus.name).to.eql('initial');
		});

		it('send quit status if game service receives quit', () => {
			gameService.rageQuit('bob');
			expect(currentStatus.name).to.eql('quit');
		});
	});

	describe('when user is a player', () => {
		var playerName = 'bob';

		beforeEach(() => {
			task.setPlayerName(playerName);
		});

		it('has set player name in game service too', () => {
			expect(gameService.playerName()).to.eql(playerName);
		});

		it('has a status of before', () => {
			expect(currentStatus.name).to.eql('before');
		});

		it('does not send a new status if game service receives player list', () => {
			gameService.sendPlayerList(['bob']);
			expect(currentStatus.name).to.eql('before');
		});

		it('does not send a new status if game service receives result', () => {
			gameService.sendResult({
				choice:'4', authors: ['bob'], choosedBy: ['alice']
			});
			expect(currentStatus.name).to.eql('before');
		});

		it('does not send a new status if game service receives scores', () => {
			gameService.sendScores([
				{name: 'bob', score: 0},
				{name: 'alice', score: 1000}
			]);
			expect(currentStatus.name).to.eql('before');
		});

		it('send quit status if game service receives quit', () => {
			gameService.rageQuit('bob');
			expect(currentStatus.name).to.eql('quit');
		});
	});

	describe('when user is observer', () => {
		beforeEach(() => {
			task.setObserver();
		});

		it('send result status if results are received', () => {
			gameService.sendResult({
				choice:'4', authors: ['bob'], choosedBy: ['alice']
			});
			expect(currentStatus.name).to.eql('results');
		});

		it('send scores status if scores are received', () => {
			gameService.sendScores([
				{name: 'bob', score: 0},
				{name: 'alice', score: 1000}
			]);

			expect(currentStatus.name).to.eql('scores');
		});

		it('sends a new status if game service receives player list', () => {
			task.setObserver();
			gameService.sendPlayerList(['bob']);
			expect(currentStatus.name).to.eql('players');
		});

		it('sends results status if results are received', () => {
			gameService.sendResult({
				choice:'4', authors: ['bob'], choosedBy: ['alice']
			});
			expect(currentStatus.name).to.eql('results');
		});

		it('send choosing status if choices are received', () => {
			gameService.sendChoices(['2','3','4','5']);

			expect(currentStatus.name).to.eql('choosing');
		});

		it('sends starting status if starting is received', () => {
			task.startGame();
			expect(currentStatus.name).to.eql('starting');
		});

		it('sends question status if question is received', () => {
			gameService.sendQuestion('2 + 2 = ?');
			expect(currentStatus.name).to.eql('question');
		});

		it('send quit status if quit is received', () => {
			gameService.rageQuit('bob');
			expect(currentStatus.name).to.eql('quit');
		});
	});

	describe('after setting player name', () => {
		var playerName = 'bob';

		beforeEach(() => {
			task.setPlayerName(playerName);
		});

		describe('after starting game', () => {
			beforeEach(() => {
				task.startGame();
			});

			it('has a status of starting', () => {
				expect(currentStatus.name).to.eql('starting');
			});

			it('cancelling start of game returns to the before status', () => {
				task.cancelStart();

				expect(currentStatus.name).to.eql('before');
			});

			describe('after game service receives a question', () => {
				beforeEach(() => {
					gameService.sendQuestion('2 + 2 = ?');
				});

				it('has a status of question', () => {
					expect(currentStatus.name).to.eql('question');
				});

				it('if game service rejects the answer, keeps the same status', () => {
					gameService.rejectNextAnswer();
					task.submitAnswer('4');
					expect(currentStatus.name).to.eql('question');
				});

				describe('after submitting an answer', () => {
					beforeEach(() => {
						task.submitAnswer('4');
					});

					it('has a status of waiting', () => {
						expect(currentStatus.name).to.eql('waiting');
					});

					describe('after game service receives choices', () => {
						beforeEach(() => {
							gameService.sendChoices(['2','3','4','5']);
						});

						it('has a status of choosing', () => {
							expect(currentStatus.name).to.eql('choosing');
						});

						describe('after choice is submitted', () => {
							beforeEach(() => {
								task.submitChoice('4');
							});

							it('has a status of waiting', () => {
								expect(currentStatus.name).to.eql('waiting');
							});
						});
					});
				});
			});
		});
	});
});
