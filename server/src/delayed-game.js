const Rx = require('rx');
const _ = require('underscore');

const Game = require('./game').Game;

class DelayedGame {
  constructor(config) {
    this._game = Game.create(config);
  }

  static create(config) {
    return new DelayedGame(config);
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
    return this._game.playerQuit();
  }

  starting() {
    return this._game.starting();
  }

  questions() {
    return this._game.questions();
  }

  choices() {
    return this._game.choices();
  }

  results() {
    return this._game.results();
  }

  scores() {
    return this._game.scores();
  }

  start() {
    this._game.start();
  }

  cancel() {
    return this._game.cancel();
  }

  answer(playerSocketId, answer) {
    this._game.answer(playerSocketId, answer);
  }

  choose(playerSocketId, choice) {
    this._game.choose(playerSocketId, choice);
  }
}

exports.Game = DelayedGame;
