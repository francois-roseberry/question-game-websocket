(function() {
	"use strict";
	
	var precondition = require('./contract').precondition;
	
	exports.start = function (gameService) {
		precondition(gameService &&
			_.isFunction(gameService.setPlayerName) &&
			_.isFunction(gameService.players) &&
			_.isFunction(gameService.startGame) &&
			_.isFunction(gameService.starting) &&
			_.isFunction(gameService.cancelStart) &&
			_.isFunction(gameService.questions) &&
			_.isFunction(gameService.submitAnswer) &&
			_.isFunction(gameService.choices) &&
			_.isFunction(gameService.submitChoice) &&
			_.isFunction(gameService.results) &&
			_.isFunction(gameService.scores) &&
			_.isFunction(gameService.playerQuit),
			'PlayGameTask requires a valid game service');
		
		var task = new PlayGameTask(gameService);
		
		gameService.questions().subscribe(function (question) {
			if (task._playerName || task._isObserver) {
				task._status.onNext(
					questionStatus(question.question, question.index, question.total, task._isObserver)
				);
			}
		});
		
		gameService.starting().subscribe(function (remainingSeconds) {
			if (task._playerName || task._isObserver) {
				task._status.onNext(startingStatus(remainingSeconds, task._isObserver));
			}
		});
		
		gameService.players().subscribe(function (playerArray) {
			if (task._isObserver) {
				task._status.onNext(playersStatus(playerArray));
			}
		});
		
		gameService.choices().subscribe(function (choices) {
			if (task._playerName || task._isObserver) {
				task._status.onNext(choosingStatus(choices, task._isObserver));
			}
		});
		
		gameService.results().subscribe(function (results) {
			if (task._isObserver) {
				task._status.onNext(resultsStatus(results));
			}
		});
		
		gameService.scores().subscribe(function (scores) {
			if (task._isObserver) {
				task._status.onNext(scoresStatus(scores.scores, scores.isFinal));
			}
		});
		
		gameService.playerQuit().subscribe(function (playerName) {
			task._status.onNext(quitStatus(playerName));
		});
		
		return task;
	};
	
	function PlayGameTask(gameService) {
		this._status = new Rx.BehaviorSubject(initialStatus());
		this._gameService = gameService;
		this._isObserver = false;
	}
	
	PlayGameTask.prototype.setPlayerName = function (name) {
		precondition(_.isString(name), 'Player name must be a string');
		precondition(!this._playerName, 'Player name has already been set');
		
		if (name === 'TRUTH') {
			this._status.onNext(initialStatus('TRUTH'));
			return;
		}
		
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
	
	PlayGameTask.prototype.setObserver = function () {
		this._isObserver = true;
		this._status.onNext(playersStatus([]));
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
		var gameService = this._gameService;
		status.take(1).subscribe(function (currentStatus) {
			currentStatus.match({
				question: function (question, questionIndex, questionCount, isObserver) {
					gameService.submitAnswer(answer, function (success, error) {
						if (success) {
							status.onNext(waitingStatus());
						} else {
							status.onNext(questionStatus(question, questionIndex, questionCount, isObserver, error));
						}
					});
				}
			});
		});
	};
	
	PlayGameTask.prototype.submitChoice = function (choice) {
		precondition(_.isString(choice), 'Submitting a choice require that choice');
		
		this._gameService.submitChoice(choice);
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
	
	function startingStatus(remainingSeconds, isObserver) {
		return {
			name: 'starting',
			match: function (visitor) {
				return visitor.starting(remainingSeconds, isObserver);
			}
		};
	}
	
	function questionStatus(question, questionIndex, questionCount, isObserver, error) {
		return {
			name: 'question',
			match: function (visitor) {
				return visitor.question(question, questionIndex, questionCount, isObserver, error);
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
	
	function choosingStatus(choices, isObserver) {
		return {
			name: 'choosing',
			match: function (visitor) {
				return visitor.choosing(choices, isObserver);
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
	
	function scoresStatus(scores, isFinal) {
		return {
			name: 'scores',
			match: function (visitor) {
				return visitor.scores(scores, isFinal);
			}
		};
	}
	
	function playersStatus(playerArray) {
		return {
			name: 'players',
			match: function (visitor) {
				return visitor.players(playerArray);
			}
		};
	}
	
	function quitStatus(playerName) {
		return {
			name: 'quit',
			match: function (visitor) {
				return visitor.quit(playerName);
			}
		};
	}
}());