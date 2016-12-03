(function() {
	"use strict";
	
	exports.create = function () {
		return new GameService();
	}; 
	
	function GameService() {
		this._questions = new Rx.Subject();
	}
	
	GameService.prototype.questions = function () {
		return this._questions.asObservable();
	};
}());