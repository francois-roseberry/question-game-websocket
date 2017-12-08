const expect = require('chai').expect;
const _ = require('underscore');

const Game = require('../../src/delayed-game').Game;
const gameStartedAnsweredChosenWithResultsOneByOne = require('./unit-test-utils').gameStartedAnsweredChosenWithResultsOneByOne;
const gameStartedAnswered = require('./unit-test-utils.js').gameStartedAnswered;
const GameCreator = require('./unit-test-utils').GameCreator;
const QUESTIONS = require('./unit-test-utils').QUESTIONS;
const CONFIG = require('./unit-test-utils').CONFIG;

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
        expect(_.isEqual(results[0], { choice: ANSWERS.player1, authors: [player1.name], choosedBy: [player2.name] })).to.eql(true);
        expect(_.isEqual(results[1], { choice: ANSWERS.player2, authors: [player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });

    it.skip('after sending scores, should wait for specified time before sending new question', done => {
      const TRUTH = QUESTIONS[0].answer;
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };
      const CHOICES = { player1: TRUTH + '1', player2: TRUTH };
      gameStartedAnswered(ANSWERS, (game, player1, player2) => {
        game.questions().take(1).subscribe(question => {
          console.log('question received : ', question);
          done();
        });
        game.choose(player1.socketId, CHOICES.player1);
        game.choose(player2.socketId, CHOICES.player2);
      });

      //gameStartedAnsweredChosen(ANSWERS, CHOICES, game => {
        //setTimeout(() => {

        //}, CONFIG.secondsAfterScore * CONFIG.millisecondsPerSeconds);
      //});
    });

    afterEach(() => {
      GameCreator.create = originalCreate;
    });
  });
});
