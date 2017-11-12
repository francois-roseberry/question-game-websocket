var expect = require('chai').expect;
var _ = require('underscore');

var Game = require('../../src/game').Game;
var newPlayer = require('../../src/player').newPlayer;

describe('A game', () => {
  it('can be created', () => {
    Game.create(1);
  });

  describe('adding a player', () => {
    it('adds a new player with that name to its list of players', () => {
      var game = Game.create(1);
      game.addPlayer(newPlayer('bob'));

      var names = game.players().map(player => player.name);
      expect(_.contains(names, 'bob')).to.eql(true);
    });

    it('throws an error if a player already has that name', () => {
      var game = Game.create(1);
      game.addPlayer(newPlayer('bob'));

      expect(() => {
        game.addPlayer(newPlayer('bob'));
      }).to.throw(/EXISTING/);
    });

    it('throws an error if game is already started', () => {
      var game = Game.create(1);
      game.addPlayer(newPlayer('bob'));
      game.start();

      expect(() => {
        game.addPlayer(newPlayer('alice'));
      }).to.throw(/ALREADY_STARTED/);
    });
  });
});
