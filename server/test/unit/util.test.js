var expect = require('chai').expect;
var _ = require('underscore');

var shuffle = require('../../src/util').shuffle;

describe('Shuffling an array', () => {
  it('returns an array of the same length', () => {
    const toShuffle = [1, 2, 3, 4, 5];
    shuffle(toShuffle);
    expect(toShuffle.length).to.eql(5);
  });

  it('returns an array containing all the same elements', () => {
    const toShuffle = [1, 2, 3, 4, 5];
    const original = toShuffle.slice(0);
    shuffle(toShuffle);

    original.forEach(element => {
      expect(_.contains(toShuffle, element)).to.eql(true);
    });
  });
});
