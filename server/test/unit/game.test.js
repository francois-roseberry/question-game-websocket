const expect = require('chai').expect;
const _ = require('underscore');
const Rx = require('rx');

const Game = require('../../src/game').Game;
const newPlayer = require('../../src/player').newPlayer;
const gameStarted = require('./unit-test-utils').gameStarted;
const gameStartedAnswered = require('./unit-test-utils').gameStartedAnswered;
const gameStartedAnsweredChosen = require('./unit-test-utils').gameStartedAnsweredChosen;
const gameCompleted = require('./unit-test-utils').gameCompleted;
const contains = require('./unit-test-utils').contains;
const assertResultsDoNotContainChoice = require('./unit-test-utils').assertResultsDoNotContainChoice;
const QUESTIONS = require('./unit-test-utils').QUESTIONS;

describe('A game', () => {
  it('can be created', () => {
    Game.create([]);
  });

  describe('adding a player', () => {
    it('adds a new player with that name to its list of players', () => {
      const game = Game.create(QUESTIONS);
      game.addPlayer(newPlayer('bob'));

      const names = game.players().map(player => player.name);
      expect(_.contains(names, 'bob')).to.eql(true);
    });

    it('throws an error if a player already has that name', () => {
      const game = Game.create(QUESTIONS);
      game.addPlayer(newPlayer('bob'));

      expect(() => {
        game.addPlayer(newPlayer('bob'));
      }).to.throw(/EXISTING/);
    });

    it('throws an error if game is already started', () => {
      const game = Game.create(QUESTIONS);
      game.addPlayer(newPlayer('bob'));
      game.start();

      expect(() => {
        game.addPlayer(newPlayer('alice'));
      }).to.throw(/ALREADY_STARTED/);
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

    it('sends the first question', done => {
      gameStarted((game, player1, player2, question) => {
        expect(question).to.eql(QUESTIONS[0].question);
        done();
      });
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
  });

  describe('when every player has answered, sends a choice array', () => {
    const TRUTH = QUESTIONS[0].answer;
    const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };

    it('containing the truth', done => {
      gameStartedAnswered(ANSWERS, (game, player1, player2, choices) => {
        expect(choices).to.contain(TRUTH);
        done();
      });
    });

    it('containing unique choices', done => {
      gameStartedAnswered(ANSWERS, (game, player1, player2, choices) => {
        expect(choices.length).to.eql(_.uniq(choices).length);
        done();
      });
    });

    it('containing the answer of each player', done => {
      gameStartedAnswered(ANSWERS, (game, player1, player2, choices) => {
        expect(choices).to.contain(player1.lastAnswer);
        expect(choices).to.contain(player2.lastAnswer);
        done();
      });
    });
  });

  describe('when every player has chosen, sends the results', () => {
    const TRUTH = QUESTIONS[0].answer;

    it('giving 1000 points to each player who found the truth', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH, player2: TRUTH + '2' };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2) => {
        expect(player1.score).to.eql(1000);
        expect(player2.score).to.eql(0);
        done();
      });
    });

    it('giving 500 points to each player who authored a choice picked by others', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '1', player2: TRUTH + '1' };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2) => {
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
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2, results) => {
        expect(contains(results, { choice: TRUTH, authors: ['TRUTH'], choosedBy: [player1.name, player2.name] })).to.eql(true);
        done();
      });
    });

    it('containing a result for each player answer chosen by at least one person', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '2', player2: TRUTH + '1' };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2, results) => {
        expect(contains(results, { choice: CHOICES.player2, authors: [player1.name], choosedBy: [player2.name] })).to.eql(true);
        expect(contains(results, { choice: CHOICES.player1, authors: [player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });

    it('not containing a result for player answers chosen by nobody', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const CHOICES = { player1: TRUTH + '2', player2: TRUTH + '2' };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2, results) => {
        assertResultsDoNotContainChoice(ANSWERS.player1, results);
        done();
      });
    });

    it('containing result with multiple authors if answer was authored by more than one player', done => {
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };
      const CHOICES = { player1: TRUTH + '1', player2: TRUTH };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2, results) => {
        expect(contains(results, { choice: CHOICES.player1, authors: [player1.name, player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });
  });

  describe('after choosing', () => {
    it('send scores, with an entry for every player', done => {
      const TRUTH = QUESTIONS[0].answer;
      const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };
      const CHOICES = { player1: TRUTH + '1', player2: TRUTH };
      gameStartedAnsweredChosen(ANSWERS, CHOICES, (game, player1, player2, results, scores) => {
        expect(contains(scores.array, { name: player1.name, score: 0 })).to.eql(true);
        expect(contains(scores.array, { name: player2.name, score: 1500 })).to.eql(true);
        expect(scores.final).to.eql(false);
        done();
      });
    });
  });

  describe('after choosing, when there are still more questions', () => {
    describe('when there are more questions', () => {
      it('sends the next question', done => {
        const TRUTH = QUESTIONS[0].answer;
        const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };
        const CHOICES = { player1: TRUTH + '1', player2: TRUTH };
        gameStartedAnswered(ANSWERS, (game, player1, player2) => {
          game.questions().take(1).subscribe(question => {
            expect(question).to.eql(QUESTIONS[1].question);
            done();
          });
          game.choose(player1.socketId, CHOICES.player1);
          game.choose(player2.socketId, CHOICES.player2);
        });
      });
    });

    describe('when there are no more questions', () => {
      it('scores are marked as final', done => {
        const TRUTH = QUESTIONS[0].answer;
        const ANSWERS = { player1: TRUTH + '1', player2: TRUTH + '1' };
        const CHOICES = { player1: TRUTH + '1', player2: TRUTH };
        gameCompleted(ANSWERS, CHOICES, (game, player1, player2, scores) => {
          expect(scores.final).to.eql(true);
          done();
        });
      });
    });
  })
});
