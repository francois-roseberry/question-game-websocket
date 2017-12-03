const expect = require('chai').expect;
const _ = require('underscore');

const Game = require('../../src/delayed-game').Game;
const gameStartedAnsweredChosenWithResultsOneByOne = require('./unit-test-utils').gameStartedAnsweredChosenWithResultsOneByOne;
const GameCreator = require('./unit-test-utils').GameCreator;
const QUESTIONS = require('./unit-test-utils').QUESTIONS;

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

    it('if game is cancelled before countdown reaches zero, stops sending starting events', done => {
      const game = Game.create(CONFIG);
      game.starting().take(2).toArray().subscribe(() => {
        // Only one event is sent, then no more, hence why the take(2)
        done(new Error('should never be called'));
      });
      game.start();
      game.cancel();
      done();
    });
  });

  describe('', () => {
    let originalCreate;

    beforeEach(() => {
      originalCreate = GameCreator.create;
      GameCreator.create = questions => Game.create(CONFIG);
    });

    it('should send results one by one', done => {
      const TRUTH = QUESTIONS[0].answer;
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '2', player2: TRUTH + '1' };
      gameStartedAnsweredChosenWithResultsOneByOne(ANSWERS, CHOICES, (game, player1, player2, results) => {
        expect(_.isEqual(results[0], { choice: CHOICES.player2, authors: [player1.name], choosedBy: [player2.name] })).to.eql(true);
        expect(_.isEqual(results[1], { choice: CHOICES.player1, authors: [player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });

    afterEach(() => {
      GameCreator.create = originalCreate;
    });
  });
});
