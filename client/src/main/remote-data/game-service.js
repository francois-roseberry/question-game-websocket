(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.create = function () {
		return new GameService();
	}; 
	
	function GameService() {
		var players = new Rx.Subject();
		var starting = new Rx.Subject();
		var questions = new Rx.Subject();
		var choices = new Rx.Subject();
		var results = new Rx.Subject();
		var scores = new Rx.Subject();
		
		this._socket = io();
		this._players = players;
		this._starting = starting;
		this._questions = questions;
		this._choices = choices;
		this._results = results;
		this._scores = scores;
		
		this._socket.on('players', function (playersArray) {
			players.onNext(playersArray);
		});
		
		this._socket.on('starting', function (remainingSeconds) {
			starting.onNext(remainingSeconds);
		});
		
		this._socket.on('question', function (question, questionIndex, questionCount) {
			questions.onNext({
				question: question, 
				index: questionIndex,
				total: questionCount
			});
		});
		
		this._socket.on('choices', function (choicesArray) {
			choices.onNext(choicesArray);
		});
		
		this._socket.on('result', function (result) {
			console.log('GameService : result received');
			results.onNext(result);
		});
		
		this._socket.on('scores', function (scoresArray, isFinal) {
			scores.onNext({
				scores: scoresArray,
				isFinal: isFinal
			});
		});
	}
	
	GameService.prototype.players = function () {
		return this._players.asObservable();
	};
	
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
	
	GameService.prototype.scores = function () {
		return this._scores.asObservable();
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
	
	GameService.prototype.submitChoice = function (choice) {
		this._socket.emit('choice', choice);
	};
}());