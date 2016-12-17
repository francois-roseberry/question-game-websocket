(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.create = function () {
		return new FakeGameService();
	}; 
	
	function FakeGameService() {
		this._rejectNextName = false;
		this._rejectNextAnswer = false;
		this._players = new Rx.Subject();
		this._starting = new Rx.Subject();
		this._questions = new Rx.Subject();
		this._choices = new Rx.Subject();
		this._results = new Rx.Subject();
		this._scores = new Rx.Subject();
	}
	
	FakeGameService.prototype.rejectNextName = function () {
		this._rejectNextName = true;
	};
	
	FakeGameService.prototype.rejectNextAnswer = function () {
		this._rejectNextAnswer = true;
	};
	
	FakeGameService.prototype.setPlayerName = function (name, callback) {
		if (this._rejectNextName) {
			this._rejectNextName = false;
			callback(false, 'EXISTING');
			return;
		}
		
		this._name = name;
		callback(true);
	};
	
	FakeGameService.prototype.playerName = function () {
		return this._name;
	};
	
	FakeGameService.prototype.sendPlayerList = function (playersArray) {
		this._players.onNext(playersArray);
	};
	
	FakeGameService.prototype.sendQuestion = function (question) {
		precondition(_.isString(question), 'Sending a question requires said question');
		
		this._questions.onNext(question);
	};
	
	FakeGameService.prototype.sendChoices = function (choices) {
		this._choices.onNext(choices);
	};
	
	FakeGameService.prototype.sendScores = function (scores) {
		this._scores.onNext(scores);
	};
	
	FakeGameService.prototype.sendResults = function (results) {
		this._results.onNext(results);
	};
	
	FakeGameService.prototype.startGame = function () {
		this._starting.onNext(5);
	};
	
	FakeGameService.prototype.cancelStart = function (callback) {
		callback();
	};
	
	FakeGameService.prototype.submitAnswer = function (answer, callback) {
		if (this._rejectNextAnswer) {
			this._rejectNextAnswer = false;
			callback(false, 'TRUTH');
			return;
		}
		
		callback(true);
	};
	
	FakeGameService.prototype.submitChoice = function (choiceIndex) {
		// Do nothing.
	};
	
	FakeGameService.prototype.players = function () {
		return this._players.asObservable();
	};
	
	FakeGameService.prototype.starting = function () {
		return this._starting.asObservable();
	};
	
	FakeGameService.prototype.questions = function () {
		return this._questions.asObservable();
	};
	
	FakeGameService.prototype.choices = function () {
		return this._choices.asObservable();
	};
	
	FakeGameService.prototype.results = function () {
		return this._results.asObservable();
	};
	
	FakeGameService.prototype.scores = function () {
		return this._scores.asObservable();
	};
}());