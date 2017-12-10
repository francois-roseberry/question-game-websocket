const Rx = require('rx');
const _ = require('underscore');

const Game = require('./game').Game;

const GameStates = {
  NOT_STARTED: 'not_started',
  STARTING: 'starting',
  CANCELLING: 'cancelling',
  STARTED: 'started'
};

class DelayedGame {
  constructor(config) {
    this._game = Game.create(config.questions);
    this._config = config;
    this._countdownObject = {};
    this._starting = new Rx.Subject();
    this._state = GameStates.NOT_STARTED;
  }

  static create(questions) {
    return new DelayedGame(questions);
  }

  addPlayer(player) {
    this._game.addPlayer(player);
  }

  removePlayer(playerSocketId) {
    this._game.removePlayer(playerSocketId);
  }

  playerName(playerSocketId) {
    return this._game.playerName(playerSocketId);
  }

  players() {
    return this._game.players();
  }

  playerQuit() {
    return this._game.playerQuit().do(() => {
      if (this._countdownObject.timer) {
        clearTimeout(this._countdownObject.timer);
        this._countdownObject.timer = null;
      }
    });
  }

  starting() {
    return this._starting.asObservable();
  }

  questions() {
    // Do NOT send the question directly, so it does not hide the scores
    return this._game.questions().flatMap(({index, question}) => {
      const delayAfterScores = this._config.millisecondsPerSecond * this._config.secondsAfterScore;
      const singleSubject = Rx.Observable.of({index, question});
      return index == 0 ? singleSubject : singleSubject.delay(delayAfterScores);
    });
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
    this._state = GameStates.STARTING;
    const onCountdownComplete = () => {
      if (this._state === GameStates.STARTING) {
        this._game.start();
        this._state = GameStates.STARTED;
      } else {
        this._game.emitPlayers();
        this._state = GameStates.NOT_STARTED;
      }
    };

    Rx.Observable.interval(this._config.millisecondsPerSecond)
     .take(this._config.secondsBeforeStart)
     .takeWhile(() => this._state === GameStates.STARTING)
     .map(value => this._config.secondsBeforeStart - value)
     .subscribe(seconds => {
       this._starting.onNext(seconds);
     }, _.noop, onCountdownComplete);

    /*countdown(this._starting, this._config.millisecondsPerSecond, this._countdownObject, this._config.secondsBeforeStart, () => {
      this._game.start();
    });*/
  }

  cancel() {
    if (this._state === GameStates.STARTING/*this._countdownObject.timer*/) {
      this._state = GameStates.CANCELLING;
      //clearTimeout(this._countdownObject.timer);
      //this._countdownObject.timer = null;
      return true;
    }

    return false;
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
