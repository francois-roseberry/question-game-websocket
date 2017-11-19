var _ = require('underscore');
var Rx = require('rx');

var newPlayer = require('./player').newPlayer;
var shuffle = require('./util').shuffle;

const POINTS_FOR_TRUTH = 1000;
const POINTS_FOR_LIE = 500;

const TIME_BETWEEN_RESULTS = 5000;
const TIME_AFTER_SCORES = 5000;
const SECONDS_BEFORE_START = 5;

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
  }

  static create(questions) {
    return new Game(questions);
  }

  addPlayer(player) {
    if (this._gameStarted) {
      throw new Error('ALREADY_STARTED');
    }

    var names = _.map(this._players, player => player.name);
    if (_.contains(names, player.name)) {
      throw new Error('EXISTING');
    }

    this._players[player.socketId] = player;
  }

  players() {
    return _.values(this._players);
  }

  start() {
    this._gameStarted = true;
    this._questionSubject.onNext(this._questions[this._questionIndex].question);
  }

  questions() {
    return this._questionSubject.asObservable();
  }

  choices() {
    return this._choicesSubject.asObservable();
  }

  answer(playerSocketId, answer) {
    var truth = this._questions[this._questionIndex].answer;
    if (truth === answer) {
      throw new Error('TRUTH');
    }

    this._players[playerSocketId].lastAnswer = answer;

    if (hasEveryPlayerAnswered(this._players)) {
      var choices = computeChoices(truth, this._players);
      shuffle(choices);
      this._choicesSubject.onNext(choices);
    }
  }

  choose(playerSocketId, choice) {
    this._players[playerSocketId].lastChoice = choice;

    if (hasEveryPlayerChosen(this._players)) {
      var truth = this._questions[this._questionIndex].answer;

      _.each(this._players, player => {
        if (player.lastChoice === truth) {
          player.score += POINTS_FOR_TRUTH;
        } else {
          _.each(this._players, potentialAuthor => {
            if (potentialAuthor.lastAnswer === player.lastChoice && potentialAuthor.socketId !== player.socketId) {
              potentialAuthor.score += POINTS_FOR_LIE;
            }
          });
        }
      });
    }
  }
}

function hasEveryPlayerAnswered(players) {
  return _.every(players, player => player.lastAnswer !== null);
}

function hasEveryPlayerChosen(players) {
	return _.every(players, player => player.lastChoice !== null);
}

function computeChoices(truth, players) {
  var answers = _.map(players, player => player.lastAnswer);

  return _.uniq(answers).concat([truth]);
}

exports.Game = Game;
