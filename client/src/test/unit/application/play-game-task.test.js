(function() {
	"use strict";
	
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
		
		it('if game service rejects the name, keeps the same status', function() {
			gameService.rejectNextName();
			task.setPlayerName('bob');
			expect(currentStatus.name).to.eql('initial');
		});
		
		describe('after setting player name', function () {
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
					
					describe('after results are received', function () {
						beforeEach(function() {
							gameService.sendResults([
								{choice:'4', author:'bob', choosedBy: ['alice']},
								{choice:'5', author: 'truth', choosedBy: ['bob']}
							]);
						});
						
						it('has a status of results', function () {
							expect(currentStatus.name).to.eql('results');
						});
					});
					
					describe('after scores are received', function () {
						beforeEach(function () {
							gameService.sendScores([
								{name: 'bob', score: 0},
								{name: 'alic', score: 1000}
							]);
							
							it('has a status of scores', function () {
								expect(currentStatus.name).to.eql('scores');
							});
						});
					});
				});
			});
		});
	});
}());