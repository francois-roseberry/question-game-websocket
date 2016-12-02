(function() {
	"use strict";
	
	var PlayGameTask = require('./play-game-task');
	
	describe('A Play game task', function () {
		var task;
		var currentStatus;
		
		beforeEach(function () {
			task = PlayGameTask.start();
			task.status().subscribe(function(status) {
				currentStatus = status;
			});
		});
		
		it('has an initial status', function () {
			expect(currentStatus.name).to.eql('initial');
		});
		
		describe('after setting player name', function () {
			beforeEach(function () {
				task.setPlayerName('player');
			});
			
			it('has a status of waiting', function () {
				expect(currentStatus.name).to.eql('waiting');
			});
			
			describe('after starting game', function () {
				beforeEach(function () {
					task.startGame();
				});
				
				it('has a status of starting', function () {
					expect(currentStatus.name).to.eql('starting');
				});
				
				it('cancelling start of game returns to the waiting status', function () {
					task.cancelStart();
					
					expect(currentStatus.name).to.eql('waiting');
				});
			});
		});
	});
}());