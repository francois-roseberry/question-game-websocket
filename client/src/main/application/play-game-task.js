(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.start = function (gameService) {
		precondition(gameService && _.isFunction(gameService.questions), 'PlayGameTask requires a valid game service');
		
		var status = new Rx.BehaviorSubject(initialStatus());
		
		gameService.questions().subscribe(function (question) {
			status.onNext(questionStatus(question));
		});
		
		return new PlayGameTask(status);
	};
	
	function PlayGameTask(status) {
		this._status = status;
	}
	
	PlayGameTask.prototype.setPlayerName = function (name) {
		precondition(_.isString(name), 'Player name must be a string');
		precondition(!this._playerName, 'Player name has already been set');
		
		this._playerName = name;
		this._status.onNext(waitingStatus());
	};
	
	PlayGameTask.prototype.startGame = function () {
		this._status.onNext(startingStatus(5));
	};
	
	PlayGameTask.prototype.cancelStart = function () {
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
	
	function waitingStatus() {
		return {
			name: 'waiting',
			match: function (visitor) {
				return visitor.waiting();
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
}());