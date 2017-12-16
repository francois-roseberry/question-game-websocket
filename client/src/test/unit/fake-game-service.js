var precondition = require('./contract').precondition;

exports.create = () => new FakeGameService();

class FakeGameService {
	constructor() {
		this._rejectNextName = false;
		this._rejectNextAnswer = false;
		this._players = new Rx.Subject();
		this._starting = new Rx.Subject();
		this._questions = new Rx.Subject();
		this._choices = new Rx.Subject();
		this._results = new Rx.Subject();
		this._scores = new Rx.Subject();
		this._playerQuit = new Rx.Subject();
	}

	static create() {
		return new GameService();
	}

	rejectNextName() {
		this._rejectNextName = true;
	}

	rejectNextAnswer() {
		this._rejectNextAnswer = true;
	}

	setPlayerName(name, callback) {
		if (this._rejectNextName) {
			this._rejectNextName = false;
			callback(false, 'EXISTING');
			return;
		}

		this._name = name;
		callback(true);
	}

	playerName() {
		return this._name;
	}

	sendPlayerList(playersArray) {
		this._players.onNext(playersArray);
	}

	sendQuestion(question) {
		precondition(_.isString(question), 'Sending a question requires said question');

		this._questions.onNext({
			question: question,
			index: 1,
			count: 10,
			playerCount: 4
		});
	}

	sendChoices(choices) {
		this._choices.onNext(choices);
	}

	sendScores(scores) {
		this._scores.onNext({
			scores: scores,
			isFinal: true
		});
	}

	sendResult(result) {
		precondition(result &&
			_.isString(result.choice) &&
			_.isArray(result.authors) &&
			_.isArray(result.choosedBy),
			'Sending a result requires said result');

		this._results.onNext(result);
	}

	startGame() {
		this._starting.onNext(5);
	}

	cancelStart(callback) {
		callback();
	}

	submitAnswer(answer, callback) {
		if (this._rejectNextAnswer) {
			this._rejectNextAnswer = false;
			callback(false, 'TRUTH');
			return;
		}

		callback(true);
	}

	submitChoice(choice) {
		// Do nothing.
	}

	rageQuit(playerName) {
		this._playerQuit.onNext(playerName);
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
}
