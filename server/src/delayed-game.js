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
    return this._game.questions();
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
}

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
