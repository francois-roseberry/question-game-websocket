(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.create = function () {
		var socket = io();
		return new GameService(socket);
	}; 
	
	function GameService(socket) {
		this._socket = socket;
		this._questions = new Rx.Subject();
		this._choices = new Rx.Subject();
		this._results = new Rx.Subject();
	}
	
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
		precondition(_.isString(name), 'Setting a name requires said name');
		
		this._socket.emit('name', name);
	};
	
	GameService.prototype.submitAnswer = function (answer, callback) {
		
	};
	
	GameService.prototype.submitChoice = function (choiceIndex) {
		
	};
}());