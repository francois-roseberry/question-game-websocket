var expect = require('chai').expect;
var shuffle = require('../../src/util').shuffle;

describe('Shuffling an array', () => {
  it('returns an array of the same length', () => {
    const toShuffle = [1, 2, 3];
    shuffle(toShuffle);
    expect(toShuffle.length).to.eql(3);
  });

  it('returns an array containing all the same elements', () => {

  });
});
