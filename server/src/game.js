const _ = require('underscore');
const Rx = require('rx');

const GameStates = require('./states').GameStates;
const newPlayer = require('./player').newPlayer;
const shuffle = require('./util').shuffle;

const POINTS_FOR_TRUTH = 1000;
const POINTS_FOR_LIE = 500;

class Game {
  constructor(config) {
    this._players = {};
    this._questionIndex = 0;
    this._state = GameStates.NOT_STARTED;
    this._config = config;

    this._startingSubject = new Rx.Subject();
    this._questionSubject = new Rx.Subject();
    this._choicesSubject = new Rx.Subject();
    this._resultsSubject = new Rx.Subject();
    this._scoresSubject = new Rx.Subject();
    this._quitSubject = new Rx.Subject();
    this._playersSubject = new Rx.Subject();
    this._answerStateSubject = new Rx.Subject();
    this._choiceStateSubject = new Rx.Subject();
  }

  static create(questions) {
    return new Game(questions);
  }

  addPlayer(player) {
    if (this._state !== GameStates.NOT_STARTED) {
      throw new Error('ALREADY_STARTED');
    }

    const names = _.map(this._players, player => player.name);
    if (_.contains(names, player.name)) {
      throw new Error('EXISTING');
    }

    this._players[player.socketId] = player;
    this._playersSubject.onNext(this._players);
  }

  removePlayer(playerSocketId) {
    if (this._players[playerSocketId]) {
      if (this._state === GameStates.STARTING) {
        this.cancel();
      } else {
        this._state = GameStates.NOT_STARTED;
      }
      this._quitSubject.onNext(this._players[playerSocketId].name);
      delete this._players[playerSocketId];
      this._playersSubject.onNext(this._players);
    }
  }

  emitPlayers() {
    this._playersSubject.onNext(this._players);
  }

  playerName(playerSocketId) {
    return this._players[playerSocketId].name;
  }

  start() {
    if (this._state !== GameStates.NOT_STARTED) {
      throw new Error('ALREADY_STARTED');
    }

    const onCountdownComplete = () => {
      if (this._state === GameStates.STARTING) {
        this._state = GameStates.STARTED;
        this._questionSubject.onNext(
          { index: this._questionIndex, question: this._config.questions[this._questionIndex].question, playerCount: _.size(this._players) });
      } else {
        this._state = GameStates.NOT_STARTED;
        this._playersSubject.onNext(this._players);
      }
    };

    this._state = GameStates.STARTING;
    Rx.Observable.interval(this._config.millisecondsPerSecond)
     .take(this._config.secondsBeforeStart)
     .takeWhile(() => this._state === GameStates.STARTING)
     .map(value => this._config.secondsBeforeStart - value)
     .concat(delay(this._config.millisecondsPerSecond))
     .subscribe(seconds => {
       this._startingSubject.onNext(seconds);
     }, _.noop, onCountdownComplete);
  }

  cancel() {
    if (this._state === GameStates.STARTING) {
      this._state = GameStates.CANCELLING;
      return true;
    }

    return false;
  }

  answerState() {
    return this._answerStateSubject.asObservable();
  }

  choiceState() {
    return this._choiceStateSubject.asObservable();
  }

  players() {
    return this._playersSubject
      .map(players => _.values(players))
      .map(players => players.map(player => player.name))
      .asObservable();
  }

  starting() {
    return this._startingSubject.asObservable();
  }

  playerQuit() {
    return this._quitSubject.asObservable();
  }

  questions() {
    return this._questionSubject.asObservable();
  }

  choices() {
    return this._choicesSubject.asObservable();
  }

  results() {
    return this._resultsSubject.asObservable();
  }

  scores() {
    return this._scoresSubject.asObservable();
  }

  answer(playerSocketId, answer) {
    const truth = this._config.questions[this._questionIndex].answer;
    if (truth === answer) {
      throw new Error('TRUTH');
    }

    this._players[playerSocketId].lastAnswer = answer;
    this._answerStateSubject.onNext(answerState(this._players));

    if (hasEveryPlayerAnswered(this._players)) {
      let choices = computeChoices(truth, this._players);
      shuffle(choices);
      Rx.Observable.timer(1).subscribe(() => {
        this._choicesSubject.onNext(choices);
      });
    }
  }

  choose(playerSocketId, choice) {
    this._players[playerSocketId].lastChoice = choice;
    this._choiceStateSubject.onNext(choiceState(this._players));

    if (hasEveryPlayerChosen(this._players)) {
      const results = computeResults(this._config.questions, this._questionIndex, this._players);
      this._questionIndex++;
      resetAnswers(this._players);

      const delayBetweenResults = this._config.millisecondsPerSecond * this._config.secondsBetweenResults;
      oneByOne(delayBetweenResults, results).subscribe(result => {
        this._resultsSubject.onNext(result);
      }, _.noop, () => {
          const scores = { array: scoresArray(this._players), final: this._questionIndex === this._config.questions.length };
          this._scoresSubject.onNext(scores);
          Rx.Observable.timer(this._config.secondsAfterScore * this._config.millisecondsPerSecond).subscribe(() => {
            if (this._questionIndex < this._config.questions.length) {
              this._questionSubject.onNext(
                { index: this._questionIndex, question: this._config.questions[this._questionIndex].question, playerCount: _.size(this._players) });
            }
          });
      });
    }
  }
}

const delay = milliseconds => Rx.Observable.timer(milliseconds).ignoreElements();

const computeResults = (questions, index, players) => {
  const truth = questions[index].answer;
  const resultsMap = computeResultsMap(truth, players);
  return placeResultsIntoArray(resultsMap, truth);
};

const computeResultsMap = (truth, players) => {
  let resultsMap = { [truth]: { authors: ['TRUTH'], choosedBy: [] } };

  _.each(players, player => {
    resultsMap[player.lastAnswer] = getResult(resultsMap, player);
  });

  _.each(players, player => {
    if (player.lastChoice === truth) {
      player.score += POINTS_FOR_TRUTH;
      resultsMap[truth].choosedBy.push(player.name);
    } else {
      _.each(players, potentialAuthor => {
        if (potentialAuthor.lastAnswer === player.lastChoice && potentialAuthor.socketId !== player.socketId) {
          potentialAuthor.score += POINTS_FOR_LIE;
        }
      });

      resultsMap[player.lastChoice].choosedBy.push(player.name);
    }
  });

  return resultsMap;
};

const oneByOne = (delayBetweenElements, elements) => Rx.Observable
    .interval(delayBetweenElements)
    .take(elements.length)
    .map(index => elements[index])
    .concat(delay(delayBetweenElements))
    .asObservable();

const resetAnswers = players => _.map(players, player => {
  player.lastChoice = null;
  player.lastAnswer = null;
});

const scoresArray = players => _.map(players, player => ({ name: player.name, score: player.score }));

const getResult = (resultsMap, player) => {
	if (resultsMap[player.lastAnswer]) {
		let result = resultsMap[player.lastAnswer];
		result.authors.push(player.name);
		return result;
	}

	return {authors: [player.name], choosedBy:[]};
}

const placeResultsIntoArray = (resultsMap, truth) =>
  _.keys(resultsMap).map(toChoice(resultsMap))
  .filter(everythingButTruth)
  .filter(pickedByAtLeastSomeone)
	.concat([truthResult(resultsMap, truth)]);

const toChoice = resultsMap => choice => ({
  choice: choice,
  authors: resultsMap[choice].authors,
  choosedBy: resultsMap[choice].choosedBy
});

const everythingButTruth = result => result.authors[0] !== 'TRUTH';

const pickedByAtLeastSomeone = result => result.choosedBy.length > 0;

const truthResult = (resultsMap, truth) => ({
  choice: truth,
  authors: ['TRUTH'],
  choosedBy: resultsMap[truth].choosedBy
});

const answerState = players => ({
  count: _.filter(players, player => player.lastAnswer !== null).length,
  total: _.size(players)
});

const choiceState = players => ({
  count: _.filter(players, player => player.lastChoice !== null).length,
  total: _.size(players)
});

const hasEveryPlayerAnswered = players => _.every(players, player => player.lastAnswer !== null);

const hasEveryPlayerChosen = players => _.every(players, player => player.lastChoice !== null);

const computeChoices = (truth, players) => _.uniq(lastAnswers(players)).concat([truth]);

const lastAnswers = players => _.map(players, player => player.lastAnswer);

exports.Game = Game;
