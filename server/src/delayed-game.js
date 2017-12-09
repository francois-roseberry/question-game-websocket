const Rx = require('rx');

const Game = require('./game').Game;

class DelayedGame {
  constructor(config) {
    this._game = Game.create(config.questions);
    this._config = config;
    this._countdownObject = {};
    this._starting = new Rx.Subject();
  }

  static create(questions) {
    return new DelayedGame(questions);
  }

  addPlayer(player) {
    this._game.addPlayer(player);
  }

  starting() {
    return this._starting.asObservable();
  }

  questions() {
    // TODO find a way to delay question, if scores have just been sent
    // Do NOT send the question directly, so it does not hide the scores
    return this._game.questions().flatMap(({index, question}) => {
      console.log('delaying question : ', question);
      const delayAfterScores = this._config.millisecondsPerSecond * this._config.secondsAfterScore;
      const singleSubject = Rx.Observable.of({index, question});
      return index == 0 ? singleSubject : singleSubject.delay(delayAfterScores);
    });
      //return Rx.Observable.timer(0/*this._config.millisecondsPerSecond * this._config.secondsAfterScore*/);
    //});
  }

  choices() {
    return this._game.choices();
  }

  results() {
    const delayBetweenResults = this._config.millisecondsPerSecond * this._config.secondsBetweenResults;
    return this._game.results().flatMap(oneByOne(delayBetweenResults)).asObservable();
  }

  scores() {
    return this._game.scores();
  }

  start() {
    countdown(this._starting, this._config.millisecondsPerSecond, this._countdownObject, this._config.secondsBeforeStart, () => {
      this._game.start();
    });
  }

  cancel() {
    if (this._countdownObject.timer) {
      clearTimeout(this._countdownObject.timer);
      this._countdownObject.timer = null;
    }
  }

  answer(playerSocketId, answer) {
    this._game.answer(playerSocketId, answer);
  }

  choose(playerSocketId, choice) {
    this._game.choose(playerSocketId, choice);
  }
}

const oneByOne = delayBetweenElements => elements => Rx.Observable
    .interval(delayBetweenElements)
    .take(elements.length)
    .map(index => elements[index])
    .asObservable();

const countdown = (starting, millisecondsPerSecond, countdownObject, seconds, callback) => {
	starting.onNext(seconds);
	if (seconds === 0) {
		countdownObject.timer = null;
		callback();
		return;
	}

	countdownObject.timer = setTimeout(() => {
		countdown(starting, millisecondsPerSecond, countdownObject.timer, seconds - 1, callback);
	}, millisecondsPerSecond);
}

exports.Game = DelayedGame;
