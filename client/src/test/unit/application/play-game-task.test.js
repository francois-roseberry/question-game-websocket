var FakeGameService = require('./fake-game-service');
var PlayGameTask = require('./play-game-task');

describe('A Play game task', function () {
	var task;
	var gameService;
	var currentStatus;

	beforeEach(function () {
		gameService = FakeGameService.create();
		task = PlayGameTask.start(gameService);
		task.status().subscribe(function(status) {
			currentStatus = status;
		});
	});

	it('has an initial status', function () {
		expect(currentStatus.name).to.eql('initial');
	});

	describe('when user is not logged in', function () {
		it('does not send starting status if game is starting', function () {
			task.startGame();
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send a new status if game service receives player list', function () {
			gameService.sendPlayerList(['bob']);
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send a new status if question is received', function () {
			gameService.sendQuestion('2 + 2 = ?');
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send a new status if choices are received', function () {
			gameService.sendChoices(['2','3','4','5']);
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send a new status if results are received', function () {
			gameService.sendResult({
				choice:'4', authors: ['bob'], choosedBy: ['alice']
			});
			expect(currentStatus.name).to.eql('initial');
		});

		it('does not send scores status if scores are received', function () {
			gameService.sendScores([
				{name: 'bob', score: 0},
				{name: 'alice', score: 1000}
			]);
			expect(currentStatus.name).to.eql('initial');
		});

		it('sends a new players status when player becomes observer', function () {
			task.setObserver();
			expect(currentStatus.name).to.eql('players');
		});

		it('if game service rejects the name, keeps the same status', function () {
			gameService.rejectNextName();
			task.setPlayerName('bob');
			expect(currentStatus.name).to.eql('initial');
		});

		it('cannot be named TRUTH', function () {
			task.setPlayerName('TRUTH');
			expect(currentStatus.name).to.eql('initial');
		});

		it('send quit status if game service receives quit', function () {
			gameService.rageQuit('bob');
			expect(currentStatus.name).to.eql('quit');
		});
	});

	describe('when user is a player', function () {
		var playerName = 'bob';

		beforeEach(function () {
			task.setPlayerName(playerName);
		});

		it('has set player name in game service too', function () {
			expect(gameService.playerName()).to.eql(playerName);
		});

		it('has a status of before', function () {
			expect(currentStatus.name).to.eql('before');
		});

		it('does not send a new status if game service receives player list', function () {
			gameService.sendPlayerList(['bob']);
			expect(currentStatus.name).to.eql('before');
		});

		it('does not send a new status if game service receives result', function () {
			gameService.sendResult({
				choice:'4', authors: ['bob'], choosedBy: ['alice']
			});
			expect(currentStatus.name).to.eql('before');
		});

		it('does not send a new status if game service receives scores', function () {
			gameService.sendScores([
				{name: 'bob', score: 0},
				{name: 'alice', score: 1000}
			]);
			expect(currentStatus.name).to.eql('before');
		});

		it('send quit status if game service receives quit', function () {
			gameService.rageQuit('bob');
			expect(currentStatus.name).to.eql('quit');
		});
	});

	describe('when user if observer', function () {
		beforeEach(function () {
			task.setObserver();
		});

		it('send result status if results are received', function () {
			gameService.sendResult({
				choice:'4', authors: ['bob'], choosedBy: ['alice']
			});
			expect(currentStatus.name).to.eql('results');
		});

		it('send scores status if scores are received', function () {
			gameService.sendScores([
				{name: 'bob', score: 0},
				{name: 'alice', score: 1000}
			]);

			expect(currentStatus.name).to.eql('scores');
		});

		it('sends a new status if game service receives player list', function () {
			task.setObserver();
			gameService.sendPlayerList(['bob']);
			expect(currentStatus.name).to.eql('players');
		});

		it('sends results status if results are received', function () {
			gameService.sendResult({
				choice:'4', authors: ['bob'], choosedBy: ['alice']
			});
			expect(currentStatus.name).to.eql('results');
		});

		it('send choosing status if choices are received', function () {
			gameService.sendChoices(['2','3','4','5']);

			expect(currentStatus.name).to.eql('choosing');
		});

		it('sends starting status if starting is received', function () {
			task.startGame();
			expect(currentStatus.name).to.eql('starting');
		});

		it('sends question status if question is received', function () {
			gameService.sendQuestion('2 + 2 = ?');
			expect(currentStatus.name).to.eql('question');
		});

		it('send quit status if quit is received', function () {
			gameService.rageQuit('bob');
			expect(currentStatus.name).to.eql('quit');
		});
	});

	describe('after setting player name', function () {
		var playerName = 'bob';

		beforeEach(function () {
			task.setPlayerName(playerName);
		});

		describe('after starting game', function () {
			beforeEach(function () {
				task.startGame();
			});

			it('has a status of starting', function () {
				expect(currentStatus.name).to.eql('starting');
			});

			it('cancelling start of game returns to the before status', function () {
				task.cancelStart();

				expect(currentStatus.name).to.eql('before');
			});

			describe('after game service receives a question', function () {
				beforeEach(function() {
					gameService.sendQuestion('2 + 2 = ?');
				});

				it('has a status of question', function () {
					expect(currentStatus.name).to.eql('question');
				});

				it('if game service rejects the answer, keeps the same status', function () {
					gameService.rejectNextAnswer();
					task.submitAnswer('4');
					expect(currentStatus.name).to.eql('question');
				});

				describe('after submitting an answer', function () {
					beforeEach(function () {
						task.submitAnswer('4');
					});

					it('has a status of waiting', function () {
						expect(currentStatus.name).to.eql('waiting');
					});

					describe('after game service receives choices', function () {
						beforeEach(function () {
							gameService.sendChoices(['2','3','4','5']);
						});

						it('has a status of choosing', function () {
							expect(currentStatus.name).to.eql('choosing');
						});

						describe('after choice is submitted', function () {
							beforeEach(function () {
								task.submitChoice('4');
							});

							it('has a status of waiting', function () {
								expect(currentStatus.name).to.eql('waiting');
							});
						});
					});
				});
			});
		});
	});
});
