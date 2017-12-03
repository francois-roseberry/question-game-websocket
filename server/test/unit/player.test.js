const expect = require('chai').expect;

const newPlayer = require('../../src/player').newPlayer;

describe('Creating a player', () => {
  it('has the name provided', () => {
    const player = newPlayer('bob');
    expect(player.name).to.eql('bob');
  });

  it('has an initial score of zero', () => {
    const player = newPlayer('bob');
    expect(player.score).to.eql(0);
  });

  it('has the socketId 0', () => {
    const player = newPlayer('bob');
    expect(player.socketId).to.eql(0);
  });
});
