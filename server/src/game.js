const _ = require('underscore');
const Rx = require('rx');

const newPlayer = require('./player').newPlayer;
const shuffle = require('./util').shuffle;

const POINTS_FOR_TRUTH = 1000;
const POINTS_FOR_LIE = 500;

const TIME_BETWEEN_RESULTS = 5000;
const TIME_AFTER_SCORES = 5000;

class Game {
  constructor(questions) {
    this._countdownObject = {};
    this._resultCooldownTimer = null;
    this._scoreCooldownTimer = null;
    this._players = {};
    this._questionIndex = 0;

    // TODO : replace these variables with a state variable
    // BEFORE, STARTING, STARTED, ENDED, and eventually PAUSED, but for now quitting stops the game and doesn't pause
    this._gameStarted = false;
    this._gameEnded = false;

    this._questions = questions;

    this._questionSubject = new Rx.Subject();
    this._choicesSubject = new Rx.Subject();
    this._resultsSubject = new Rx.Subject();
    this._scoresSubject = new Rx.Subject();
  }

  static create(questions) {
    return new Game(questions);
  }

  addPlayer(player) {
    if (this._gameStarted) {
      throw new Error('ALREADY_STARTED');
    }

    const names = _.map(this._players, player => player.name);
    if (_.contains(names, player.name)) {
      throw new Error('EXISTING');
    }

    this._players[player.socketId] = player;
  }

  players() {
    return _.values(this._players);
  }

  start() {
    if (this._gameStarted) {
      throw new Error('ALREADY_STARTED');
    }

    this._gameStarted = true;
    this._questionSubject.onNext(this._questions[this._questionIndex].question);
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
    const truth = this._questions[this._questionIndex].answer;
    if (truth === answer) {
      throw new Error('TRUTH');
    }

    this._players[playerSocketId].lastAnswer = answer;

    if (hasEveryPlayerAnswered(this._players)) {
      let choices = computeChoices(truth, this._players);
      shuffle(choices);
      this._choicesSubject.onNext(choices);
    }
  }

  choose(playerSocketId, choice) {
    this._players[playerSocketId].lastChoice = choice;

    if (hasEveryPlayerChosen(this._players)) {
      const truth = this._questions[this._questionIndex].answer;
      let resultsMap = { [truth]: { authors: 'TRUTH', choosedBy: [] } };

      _.each(this._players, player => {
        resultsMap[player.lastAnswer] = getResult(resultsMap, player);
      });

      _.each(this._players, player => {
        if (player.lastChoice === truth) {
          player.score += POINTS_FOR_TRUTH;
          resultsMap[truth].choosedBy.push(player.name);
        } else {
          _.each(this._players, potentialAuthor => {
            if (potentialAuthor.lastAnswer === player.lastChoice && potentialAuthor.socketId !== player.socketId) {
              potentialAuthor.score += POINTS_FOR_LIE;
            }
          });

          resultsMap[player.lastChoice].choosedBy.push(player.name);
        }
      });

      const results = placeResultsIntoArray(resultsMap, truth);
      this._questionIndex++;
      resetAnswers(this._players);

      this._resultsSubject.onNext(results);
      const scores = { array: scoresArray(this._players), final: this._questionIndex === this._questions.length };
      this._scoresSubject.onNext(scores);

      if (this._questionIndex < this._questions.length) {
        this._questionSubject.onNext(this._questions[this._questionIndex].question);
      }
    }
  }
}

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

const hasEveryPlayerAnswered = players => _.every(players, player => player.lastAnswer !== null);

const hasEveryPlayerChosen = players => _.every(players, player => player.lastChoice !== null);

const computeChoices = (truth, players) => _.uniq(lastAnswers(players)).concat([truth]);

const lastAnswers = players => _.map(players, player => player.lastAnswer);

exports.Game = Game;
