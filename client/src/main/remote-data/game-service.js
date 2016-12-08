(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.create = function () {
		var starting = new Rx.Subject();
		var questions = new Rx.Subject();
		return new GameService(starting, questions);
	}; 
	
	function GameService(starting, questions) {
		this._socket = io();
		this._starting = starting;
		this._questions = questions;
		this._choices = new Rx.Subject();
		this._results = new Rx.Subject();
		
		this._socket.on('starting', function (remainingSeconds) {
			starting.onNext(remainingSeconds);
		});
		
		this._socket.on('question', function (question) {
			questions.onNext(question);
		});
	}
	
	GameService.prototype.starting = function () {
		return this._starting.asObservable();
	};
	
	GameService.prototype.questions = function () {
		return this._questions.asObservable();
	};
	
	GameService.prototype.choices = function () {
		return this._choices.asObservable();
	};
	
	GameService.prototype.results = function () {
		return this._results.asObservable();
	};
	
	GameService.prototype.setPlayerName = function (name, callback) {
		precondition(_.isString(name), 'Setting player name requires said name');
		precondition(_.isFunction(callback), 'Setting player name requires a callback for the results');
		
		this._socket.emit('name', name);
		this._socket.once('name response', function (success, errors) {
			callback(success, errors);
		});
	};
	
	GameService.prototype.startGame = function () {
		this._socket.emit('start');
	};
	
	GameService.prototype.cancelStart = function (callback) {
		this._socket.emit('cancel');
		this._socket.once('cancelled', callback);
	};
	
	GameService.prototype.submitAnswer = function (answer, callback) {
		this._socket.emit('answer', answer);
		this._socket.once('answer response', function (success, errors) {
			callback(success, errors);
		});
	};
	
	GameService.prototype.submitChoice = function (choiceIndex) {
		
	};
}());