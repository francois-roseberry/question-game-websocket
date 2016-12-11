(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.start = function (gameService) {
		precondition(gameService &&
			_.isFunction(gameService.setPlayerName) &&
			_.isFunction(gameService.startGame) &&
			_.isFunction(gameService.starting) &&
			_.isFunction(gameService.cancelStart) &&
			_.isFunction(gameService.questions) &&
			_.isFunction(gameService.submitAnswer) &&
			_.isFunction(gameService.choices) &&
			_.isFunction(gameService.submitChoice) &&
			_.isFunction(gameService.results),
			'PlayGameTask requires a valid game service');
		
		var status = new Rx.BehaviorSubject(initialStatus());
		
		gameService.starting().subscribe(function (remaingSeconds) {
			status.onNext(startingStatus(remaingSeconds));
		});
		
		gameService.questions().subscribe(function (question) {
			status.onNext(questionStatus(question));
		});
		
		gameService.choices().subscribe(function (choices) {
			status.onNext(choosingStatus(choices));
		});
		
		// Results will be an array of result objects.
		// Each result will be made of :
		// -choice    : the textual choice
		// -author    : either 'truth' or the name of the player who wrote it
		// -choosedBy : array of player namnes who chose it
		gameService.results().subscribe(function (results) {
			status.onNext(resultsStatus(results));
		});
		
		return new PlayGameTask(status, gameService);
	};
	
	function PlayGameTask(status, gameService) {
		this._status = status;
		this._gameService = gameService;
	}
	
	PlayGameTask.prototype.setPlayerName = function (name) {
		precondition(_.isString(name), 'Player name must be a string');
		precondition(!this._playerName, 'Player name has already been set');
		
		var self = this;
		this._gameService.setPlayerName(name, function (success, error) {
			if (success) {
				self._playerName = name;
				self._status.onNext(beforeStatus());
			} else {
				self._status.onNext(initialStatus(error));
			}
		});
	};
	
	PlayGameTask.prototype.startGame = function () {
		this._gameService.startGame();
	};
	
	PlayGameTask.prototype.cancelStart = function () {
		var status = this._status;
		this._gameService.cancelStart(function () {
			status.onNext(beforeStatus());
		});
	};
	
	PlayGameTask.prototype.submitAnswer = function (answer) {
		precondition(_.isString(answer), 'Submitting an answer requires said answer');
		
		var status = this._status;
		this._gameService.submitAnswer(answer, function (success, errors) {
			if (success) {
				status.onNext(waitingStatus());
			}
		});
	};
	
	PlayGameTask.prototype.submitChoice = function (choiceIndex) {
		precondition(_.isNumber(choiceIndex), 'Submitting a choice require the index of that choice');
		
		this._gameService.submitChoice(choiceIndex);
		this._status.onNext(waitingStatus());
	};
	
	PlayGameTask.prototype.status = function () {
		return this._status.asObservable();
	};
	
	function initialStatus(error) {
		return {
			name: 'initial',
			match: function(visitor) {
				return visitor.initial(error);
			}
		};
	}
	
	function beforeStatus() {
		return {
			name: 'before',
			match: function (visitor) {
				return visitor.before();
			}
		};
	}
	
	function startingStatus(remainingSeconds) {
		return {
			name: 'starting',
			match: function (visitor) {
				return visitor.starting(remainingSeconds);
			}
		};
	}
	
	function questionStatus(question) {
		return {
			name: 'question',
			match: function (visitor) {
				return visitor.question(question);
			}
		};
	}
	
	function waitingStatus() {
		return {
			name: 'waiting',
			match: function (visitor) {
				return visitor.waiting();
			}
		};
	}
	
	function choosingStatus(choices) {
		return {
			name: 'choosing',
			match: function (visitor) {
				return visitor.choosing(choices);
			}
		};
	}
	
	function resultsStatus(results) {
		return {
			name: 'results',
			match: function (visitor) {
				return visitor.results(results);
			}
		};
	}
}());