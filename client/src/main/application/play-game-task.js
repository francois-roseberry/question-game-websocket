(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.start = function () {
		return new PlayGameTask();
	};
	
	function PlayGameTask() {
		this._status = new Rx.BehaviorSubject(initialStatus());
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
}());