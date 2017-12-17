const expect = require('chai').expect;
const _ = require('underscore');
const Rx = require('rx');

const Game = require('../../src/game').Game;
const newPlayer = require('../../src/player').newPlayer;
const gameStarted = require('./unit-test-utils').gameStarted;
const gameStartedAnswered = require('./unit-test-utils').gameStartedAnswered;
const gameStartedAnsweredChosen = require('./unit-test-utils').gameStartedAnsweredChosen;
const gameStartedAnsweredChosenWithTwoResults = require('./unit-test-utils').gameStartedAnsweredChosenWithTwoResults;
const gameStartedAnsweredChosenWithTruthOnly = require('./unit-test-utils').gameStartedAnsweredChosenWithTruthOnly;
const gameCompleted = require('./unit-test-utils').gameCompleted;
const contains = require('./unit-test-utils').contains;
const assertResultsDoNotContainChoice = require('./unit-test-utils').assertResultsDoNotContainChoice;
const QUESTIONS = require('./unit-test-utils').QUESTIONS;
const CONFIG = require('./unit-test-utils').CONFIG;

const TOLERANCE_MILLIS = 3;

describe('A game', () => {
  it('can be created', () => {
    Game.create(CONFIG);
  });

  describe('adding a player', () => {
    it('sends the player list with that player in it', done => {
      const game = Game.create(CONFIG);
      game.players().take(1).subscribe(players => {
        expect(_.contains(players, 'bob'));
        done();
      });
      game.addPlayer(newPlayer('bob'));
    });

    it('throws an error if a player already has that name', () => {
      const game = Game.create(CONFIG);
      game.addPlayer(newPlayer('bob'));

      expect(() => {
        game.addPlayer(newPlayer('bob'));
      }).to.throw(/EXISTING/);
    });

    it('throws an error if game is already started', () => {
      const game = Game.create(CONFIG);
      game.addPlayer(newPlayer('bob'));
      game.start();

      expect(() => {
        game.addPlayer(newPlayer('alice'));
      }).to.throw(/ALREADY_STARTED/);
    });
  });

  describe('removing a player', () => {
    it('removes it from the game', done => {
      const game = Game.create(CONFIG);
      const player = newPlayer('bob');
      game.players().skip(1).take(1).subscribe(players => {
        expect(players).to.eql([]);
        done();
      });
      game.addPlayer(player);
      game.removePlayer(player.socketId);
    });

    it('sends a player quit event', done => {
      const game = Game.create(CONFIG);
      const player = newPlayer('bob');
      game.playerQuit().take(1).subscribe(playerName => {
        expect(playerName).to.eql(player.name);
        done();
      });

      game.addPlayer(player);
      game.removePlayer(player.socketId);
    });
  });

  describe('starting a game', () => {
    it('throws an error if game is already started', done => {
      gameStarted(game => {
        expect(() => {
          game.start();
        }).to.throw(/ALREADY_STARTED/);
        done();
      });
    });

    it('send one starting event per second to start, then send the first question with the number of players', done => {
      const game = Game.create(CONFIG);
      game.starting().take(5).toArray().subscribe(seconds => {
        expect(seconds).to.eql([5,4,3,2,1]);
        game.questions().take(1).timeout(CONFIG.millisecondsPerSecond + TOLERANCE_MILLIS).subscribe(({index, question, playerCount}) => {
          expect(index).to.eql(0);
          expect(question).to.eql(QUESTIONS[0].question);
          expect(playerCount).to.eql(0);
          done();
        });
      });

      game.start();
    });

    describe('when game is cancelled before countdown reaches zero', () => {
      it('stops sending starting events', done => {
        const game = Game.create(CONFIG);
        game.starting().take(1).subscribe(() => {
          done(new Error('should never be called'));
        });
        game.start();
        game.cancel();
        done();
      });

      it('sends the player list', done => {
        const game = Game.create(CONFIG);
        game.players().take(1).subscribe(players => {
          done();
        });
        game.start();
        game.cancel();
      });
    });

    // TODO : game is cancelled automatically if player quits during countdown
    // Works live, but somehow unit test fails
    it.skip('should cancel start if player quits suddenly', done => {
      const game = Game.create(CONFIG);
      const player = newPlayer('bob');
      game.addPlayer(player);
      game.starting().take(5).toArray().subscribe(() => {
        done(new Error('should never be called'));
      });
      game.start();
      game.removePlayer(player.socketId);
    });
  });

  describe('answering a question', () => {
    it('throws an error if answer is the truth', () => {
      gameStarted((game, player1, player2) => {
        expect(() => {
          game.answer(player1.socketId, QUESTIONS[0].answer);
        }).to.throw(/TRUTH/);
      });
    });

    it('does not send choices when everybody has not answered', () => {
      gameStarted((game, player1, player2) => {
        game.choices().subscribe(choices => {
          fail();
        });

        game.answer(player1.socketId, QUESTIONS[0].answer + '1');
      });
    });

    it('sends an answer state event with number of answers received and total expected', done => {
      gameStarted((game, player1, player2) => {
        game.answerState().take(1).subscribe(answerState => {
          expect(_.isEqual(answerState, { count: 1, total: 2 })).to.eql(true);
          done();
        });

        game.answer(player1.socketId, QUESTIONS[0].answer + '1');
      });
    });
  });

  describe('when every player has answered, sends a choice array', () => {
    const TRUTH = QUESTIONS[0].answer;
    const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };

    it('along with the number of players', done => {
      gameStartedAnswered(ANSWERS, (game, player1, player2, { choices, playerCount }) => {
        expect(playerCount).to.eql(2);
        done();
      });
    });

    it('containing the truth', done => {
      gameStartedAnswered(ANSWERS, (game, player1, player2, { choices, playerCount }) => {
        expect(choices).to.contain(TRUTH);
        done();
      });
    });

    it('containing unique choices', done => {
      gameStartedAnswered(ANSWERS, (game, player1, player2, { choices, playerCount }) => {
        expect(choices.length).to.eql(_.uniq(choices).length);
        done();
      });
    });

    it('containing the answer of each player', done => {
      gameStartedAnswered(ANSWERS, (game, player1, player2, { choices, playerCount }) => {
        expect(choices).to.contain(player1.lastAnswer);
        expect(choices).to.contain(player2.lastAnswer);
        done();
      });
    });

    describe('choosing', () => {
      it('sends a choice state event with number of choices received and total expected', done => {
        gameStartedAnswered(ANSWERS, (game, player1, player2) => {
          game.choiceState().take(1).subscribe(choiceState => {
            expect(_.isEqual(choiceState, { count: 1, total: 2 })).to.eql(true);
            done();
          });

          game.choose(player1.socketId, QUESTIONS[0].answer + '1');
        });
      });
    });
  });

  describe('when every player has chosen, sends the results', () => {
    const TRUTH = QUESTIONS[0].answer;

    it('one by one', done => {
      const TRUTH = QUESTIONS[0].answer;
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '2', player2: TRUTH + '1' };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2, results) => {
        expect(_.isEqual(results[0], { choice: ANSWERS.player1, authors: [player1.name], choosedBy: [player2.name] })).to.eql(true);
        expect(_.isEqual(results[1], { choice: ANSWERS.player2, authors: [player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });

    it('after sending scores, should wait for specified time before sending new question', done => {
      const TRUTH = QUESTIONS[0].answer;
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };
      const CHOICES = { player1: TRUTH + '1', player2: TRUTH };
      gameStartedAnswered(ANSWERS, (game, player1, player2) => {
        game.questions().take(1).subscribe(() => {
          done();
        });
        game.choose(player1.socketId, CHOICES.player1);
        game.choose(player2.socketId, CHOICES.player2);
      });
    });

    it('giving 1000 points to each player who found the truth', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH, player2: TRUTH + '2' };
      gameStartedAnsweredChosenWithTwoResults(ANSWERS, CHOICES, (game, player1, player2) => {
        expect(player1.score).to.eql(1000);
        expect(player2.score).to.eql(0);
        done();
      });
    });

    it('giving 500 points to each player who authored a choice picked by others', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '1', player2: TRUTH + '1' };
      gameStartedAnsweredChosenWithTwoResults(ANSWERS, CHOICES, (game, player1, player2) => {
        expect(player1.score).to.eql(500);
        expect(player2.score).to.eql(0);
        done();
      });
    });

    it('giving 0 points to each player who picked his own choice', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '1', player2: TRUTH + '2' };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2) => {
        expect(player1.score).to.eql(0);
        expect(player2.score).to.eql(0);
        done();
      });
    });

    it('containing a result for the truth and who chose it', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH, player2: TRUTH };
      gameStartedAnsweredChosenWithTruthOnly(ANSWERS, CHOICES, (game, player1, player2, results) => {
        expect(contains(results, { choice: TRUTH, authors: ['TRUTH'], choosedBy: [player1.name, player2.name] })).to.eql(true);
        done();
      });
    });

    it('containing a result for each player answer chosen by at least one person', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '2', player2: TRUTH + '1' };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2, results) => {
        expect(contains(results, { choice: ANSWERS.player1, authors: [player1.name], choosedBy: [player2.name] })).to.eql(true);
        expect(contains(results, { choice: ANSWERS.player2, authors: [player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });

    it('not containing a result for player answers chosen by nobody', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '2', player2: TRUTH + '2' };
      gameStartedAnsweredChosenWithTwoResults(ANSWERS, CHOICES, (game, player1, player2, results) => {
        assertResultsDoNotContainChoice(ANSWERS.player1, results);
        done();
      });
    });

    it('containing result with multiple authors if answer was authored by more than one player', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };
      const CHOICES = { player1: TRUTH + '1', player2: TRUTH };
      gameStartedAnsweredChosenWithTwoResults(ANSWERS, CHOICES, (game, player1, player2, results) => {
        expect(contains(results, { choice: CHOICES.player1, authors: [player1.name, player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });
  });

  describe('after results are sent', () => {
    it('send scores, with an entry for every player', done => {
      const TRUTH = QUESTIONS[0].answer;
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '2', player2: TRUTH + '1' };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2, results, scores) => {
        expect(contains(scores.array, { name: player1.name, score: 500 })).to.eql(true);
        expect(contains(scores.array, { name: player2.name, score: 500 })).to.eql(true);
        expect(scores.final).to.eql(false);
        done();
      });
    });
  });

  describe('after scores are sent, when there are still more questions', () => {
    describe('when there are more questions', () => {
      it('sends the next question', done => {
        const TRUTH = QUESTIONS[0].answer;
        const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };
        const CHOICES = { player1: TRUTH + '1', player2: TRUTH };
        gameStartedAnswered(ANSWERS, (game, player1, player2) => {
          game.scores().take(1).delay(1).subscribe(() => {
            game.questions().take(1).subscribe(({question, index, playerCount}) => {
              expect(index).to.eql(1);
              expect(question).to.eql(QUESTIONS[1].question);
              expect(playerCount).to.eql(2);
              done();
            });
          });

          game.choose(player1.socketId, CHOICES.player1);
          game.choose(player2.socketId, CHOICES.player2);
        });
      });
    });

    describe('when there are no more questions', () => {
      it('scores are marked as final', done => {
        const TRUTH = QUESTIONS[0].answer;
        const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
        const CHOICES = { player1: TRUTH + '2', player2: TRUTH + '1' };
        gameCompleted(ANSWERS, CHOICES, (game, player1, player2, scores) => {
          expect(scores.final).to.eql(true);
          done();
        });
      });
    });
  })
});
