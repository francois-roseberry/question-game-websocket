var precondition = require('./contract').precondition;

exports.create = () => new GameService();

class GameService {
	constructor() {
		this._socket = io();
		this._players = new Rx.Subject();
		this._starting = new Rx.Subject();
		this._questions = new Rx.Subject();
		this._choices = new Rx.Subject();
		this._results = new Rx.Subject();
		this._scores = new Rx.Subject();
		this._playerQuit = new Rx.Subject();
		this._answerState = new Rx.Subject();
		this._choiceState = new Rx.Subject();

		this._socket.on('players', playersArray => {
			this._players.onNext(playersArray);
		});

		this._socket.on('starting', remainingSeconds => {
			this._starting.onNext(remainingSeconds);
		});

		this._socket.on('question', (question, index, total, playerCount) => {
			this._questions.onNext({ question, index,	total, playerCount });
		});

		this._socket.on('answer state', state => {
			this._answerState.onNext(state);
		});

		this._socket.on('choice state', state => {
			this._choiceState.onNext(state);
		});

		this._socket.on('choices', (choices, playerCount) => {
			this._choices.onNext({ choices, playerCount });
		});

		this._socket.on('result', result => {
			this._results.onNext(result);
		});

		this._socket.on('scores', (scores, isFinal) => {
			this._scores.onNext({ scores, isFinal });
		});

		this._socket.on('quit', playerName => {
			this._playerQuit.onNext(playerName);
		});
	}

	players() {
		return this._players.asObservable();
	}

	starting() {
		return this._starting.asObservable();
	}

	questions() {
		return this._questions.asObservable();
	}

	answerState() {
		return this._answerState.asObservable();
	}

	choiceState() {
		return this._choiceState.asObservable();
	}

	choices() {
		return this._choices.asObservable();
	}

	results() {
		return this._results.asObservable();
	}

	scores() {
		return this._scores.asObservable();
	}

	playerQuit() {
		return this._playerQuit.asObservable();
	}

	setPlayerName(name, callback) {
		precondition(_.isString(name), 'Setting player name requires said name');
		precondition(_.isFunction(callback), 'Setting player name requires a callback for the results');

		this._socket.emit('name', name);
		this._socket.once('name response', (success, errors) => {
			callback(success, errors);
		});
	}

	startGame() {
		this._socket.emit('start');
	}

	cancelStart(callback) {
		this._socket.emit('cancel');
		this._socket.once('cancelled', callback);
	}

	submitAnswer(answer, callback) {
		this._socket.emit('answer', answer);
		this._socket.once('answer response', (success, errors) => {
			callback(success, errors);
		});
	}

	submitChoice(choice) {
		this._socket.emit('choice', choice);
	}
}
