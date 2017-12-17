var precondition = require('./contract').precondition;

exports.create = () => new GameService();

class GameService {
	constructor() {
		var players = new Rx.Subject();
		var starting = new Rx.Subject();
		var questions = new Rx.Subject();
		var choices = new Rx.Subject();
		var results = new Rx.Subject();
		var scores = new Rx.Subject();
		var playerQuit = new Rx.Subject();
		const answerState = new Rx.Subject();
		const choiceState = new Rx.Subject();

		this._socket = io();
		this._players = players;
		this._starting = starting;
		this._questions = questions;
		this._choices = choices;
		this._results = results;
		this._scores = scores;
		this._playerQuit = playerQuit;
		this._answerState = answerState;
		this._choiceState = choiceState;

		this._socket.on('players', playersArray => {
			players.onNext(playersArray);
		});

		this._socket.on('starting', remainingSeconds => {
			starting.onNext(remainingSeconds);
		});

		this._socket.on('question', (question, index, total, playerCount) => {
			questions.onNext({ question, index,	total, playerCount });
		});

		this._socket.on('answer state', state => {
			answerState.onNext(state);
		});

		this._socket.on('choice state', state => {
			choiceState.onNext(state);
		});

		this._socket.on('choices', (choicesArray, playerCount) => {
			choices.onNext({ choices: choicesArray, playerCount });
		});

		this._socket.on('result', result => {
			results.onNext(result);
		});

		this._socket.on('scores', (scoresArray, isFinal) => {
			scores.onNext({ scores: scoresArray, isFinal });
		});

		this._socket.on('quit', playerName => {
			playerQuit.onNext(playerName);
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
