(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.create = function () {
		return new FakeGameService();
	}; 
	
	function FakeGameService() {
		this._questions = new Rx.Subject();
	}
	
	FakeGameService.prototype.sendQuestion = function (question) {
		precondition(_.isString(question), 'Sending a question requires said question');
		
		this._questions.onNext(question);
	};
	
	FakeGameService.prototype.questions = function () {
		return this._questions.asObservable();
	};
}());