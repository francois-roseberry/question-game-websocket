var expect = require('chai').expect;

var Game = require('../../src/delayed-game').Game;

const QUESTIONS = [
  { question: 'A ?', answer: '1'},
  { question: 'B ?', answer: '1'},
  { question: 'C ?', answer: '1'}
];

const CONFIG = {
  questions: QUESTIONS,
  secondsBeforeStart: 5,
  millisecondsPerSecond: 0 // we put 0 for testing so we have instant events
};

describe('A DelayedGame', () => {
  it('can be created', () => {
    Game.create(CONFIG);
  });

  describe('when starting', () => {
    it('send one starting event per second to start, then send the first question', done => {
      const game = Game.create(CONFIG);
      game.starting().take(5).toArray().subscribe(seconds => {
        expect(seconds).to.eql([5,4,3,2,1]);
        game.questions().take(1).subscribe(question => {
          done();
        });
      });

      game.start();
    });
  });
});
