var expect = require('chai').expect;

var newPlayer = require('../../src/player').newPlayer;

describe('Creating a player', () => {
  it('has the name provided', () => {
    var player = newPlayer('bob');
    expect(player.name).to.eql('bob');
  });

  it('has an initial score of zero', () => {
    var player = newPlayer('bob');
    expect(player.score).to.eql(0);
  });

  it('has the socketId 0', () => {
    var player = newPlayer('bob');
    expect(player.socketId).to.eql(0);
  });
});
