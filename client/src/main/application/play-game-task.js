(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.start = function (gameService) {
		precondition(gameService &&
			_.isFunction(gameService.setPlayerName) &&
			_.isFunction(gameService.questions) &&
			_.isFunction(gameService.submitAnswer) &&
			_.isFunction(gameService.choices) &&
			_.isFunction(gameService.submitChoice),
			'PlayGameTask requires a valid game service');
		
		var status = new Rx.BehaviorSubject(initialStatus());
		
		gameService.questions().subscribe(function (question) {
			status.onNext(questionStatus(question));
		});
		
		gameService.choices().subscribe(function (choices) {
			status.onNext(choosingStatus(choices));
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
		this._gameService.setPlayerName(name, function (success, errors) {
			if (success) {
				self._playerName = name;
				self._status.onNext(beforeStatus());
			}
		});
	};
	
	PlayGameTask.prototype.startGame = function () {
		this._status.onNext(startingStatus(5));
	};
	
	PlayGameTask.prototype.cancelStart = function () {
		this._status.onNext(beforeStatus());
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
	
	function initialStatus() {
		return {
			name: 'initial',
			match: function(visitor) {
				return visitor.initial();
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
}());