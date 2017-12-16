var precondition = require('./contract').precondition;

exports.start = gameService => {
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

	gameService.questions().subscribe(({question, index, total, playerCount}) => {
		if (task._playerName || task._isObserver) {
			task._status.onNext(
				questionStatus(question, index, total, playerCount, task._isObserver)
			);
		}
	});

	gameService.starting().subscribe(remainingSeconds => {
		if (task._playerName || task._isObserver) {
			task._status.onNext(startingStatus(remainingSeconds, task._isObserver));
		}
	});

	gameService.players().subscribe(playerArray => {
		if (task._isObserver) {
			task._status.onNext(playersStatus(playerArray));
		}
	});

	gameService.choices().subscribe(choices => {
		if (task._playerName || task._isObserver) {
			task._status.onNext(choosingStatus(choices, task._isObserver));
		}
	});

	gameService.results().subscribe(results => {
		if (task._isObserver) {
			task._status.onNext(resultsStatus(results));
		}
	});

	gameService.scores().subscribe(scores => {
		if (task._isObserver) {
			task._status.onNext(scoresStatus(scores.scores, scores.isFinal));
		}
	});

	gameService.playerQuit().subscribe(playerName => {
		task._status.onNext(quitStatus(playerName));
	});

	return task;
};

class PlayGameTask {
	constructor(gameService) {
		this._status = new Rx.BehaviorSubject(initialStatus());
		this._gameService = gameService;
		this._isObserver = false;
	}

	setPlayerName(name) {
		precondition(_.isString(name), 'Player name must be a string');
		precondition(!this._playerName, 'Player name has already been set');

		if (name === 'TRUTH') {
			this._status.onNext(initialStatus('TRUTH'));
			return;
		}

		var self = this;
		this._gameService.setPlayerName(name, (success, error) => {
			if (success) {
				self._playerName = name;
				self._status.onNext(beforeStatus());
			} else {
				self._status.onNext(initialStatus(error));
			}
		});
	}

	setObserver() {
		this._isObserver = true;
		this._status.onNext(playersStatus([]));
	}

	startGame() {
		this._gameService.startGame();
	}

	cancelStart() {
		var status = this._status;
		this._gameService.cancelStart(() => {
			status.onNext(beforeStatus());
		});
	}

	submitAnswer(answer) {
		precondition(_.isString(answer), 'Submitting an answer requires said answer');

		var status = this._status;
		var gameService = this._gameService;
		status.take(1).subscribe(currentStatus => {
			currentStatus.match({
				question: (question, questionIndex, questionCount, playerCount, isObserver) => {
					gameService.submitAnswer(answer, (success, error) => {
						if (success) {
							status.onNext(waitingStatus());
						} else {
							status.onNext(questionStatus(question, questionIndex, questionCount, playerCount, isObserver, error));
						}
					});
				}
			});
		});
	}

	submitChoice(choice) {
		precondition(_.isString(choice), 'Submitting a choice require that choice');

		this._gameService.submitChoice(choice);
		this._status.onNext(waitingStatus());
	}

	status() {
		return this._status.asObservable();
	}
}

const initialStatus = error => ({
	name: 'initial',
	match: visitor => visitor.initial(error)
});

const beforeStatus = () => ({
	name: 'before',
	match: visitor => visitor.before()
});

const startingStatus = (remainingSeconds, isObserver) => ({
	name: 'starting',
	match: visitor => visitor.starting(remainingSeconds, isObserver)
});

const questionStatus = (question, questionIndex, questionCount, playerCount, isObserver, error) => ({
	name: 'question',
	match: visitor => visitor.question(question, questionIndex, questionCount, playerCount, isObserver, error)
});

const waitingStatus = () => ({
	name: 'waiting',
	match: visitor => visitor.waiting()
});

const choosingStatus = (choices, isObserver) => ({
	name: 'choosing',
	match: visitor => visitor.choosing(choices, isObserver)
});

const resultsStatus = results => ({
	name: 'results',
	match: visitor => visitor.results(results)
});

const scoresStatus = (scores, isFinal) => ({
	name: 'scores',
	match: visitor => visitor.scores(scores, isFinal)
});

const playersStatus = playerArray => ({
	name: 'players',
	match: visitor => visitor.players(playerArray)
});

const quitStatus = playerName => ({
	name: 'quit',
	match: visitor => visitor.quit(playerName)
});
