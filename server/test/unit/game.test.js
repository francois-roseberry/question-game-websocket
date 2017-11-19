var expect = require('chai').expect;
var _ = require('underscore');

var Game = require('../../src/game').Game;
var newPlayer = require('../../src/player').newPlayer;

const QUESTIONS = [
  { question: 'A ?', answer: '1'},
  { question: 'B ?', answer: '2'},
  { question: 'C ?', answer: '3'}
];

describe('A game', () => {
  it('can be created', () => {
    Game.create([]);
  });

  describe('adding a player', () => {
    it('adds a new player with that name to its list of players', () => {
      var game = Game.create(QUESTIONS);
      game.addPlayer(newPlayer('bob'));

      var names = game.players().map(player => player.name);
      expect(_.contains(names, 'bob')).to.eql(true);
    });

    it('throws an error if a player already has that name', () => {
      var game = Game.create(QUESTIONS);
      game.addPlayer(newPlayer('bob'));

      expect(() => {
        game.addPlayer(newPlayer('bob'));
      }).to.throw(/EXISTING/);
    });

    it('throws an error if game is already started', () => {
      var game = Game.create(QUESTIONS);
      game.addPlayer(newPlayer('bob'));
      game.start();

      expect(() => {
        game.addPlayer(newPlayer('alice'));
      }).to.throw(/ALREADY_STARTED/);
    });
  });

  describe('starting a game', () => {
    it('throws an error if game is already started', done => {
      twoPlayerGameStarted(game => {
        expect(() => {
          game.start();
        }).to.throw(/ALREADY_STARTED/);
        done();
      });
    });

    it('sends the first question', done => {
      twoPlayerGameStarted((game, player1, player2, question) => {
        expect(question).to.eql(QUESTIONS[0].question);
        done();
      });
    });
  });

  describe('answering a question', () => {
    it('throws an error if answer is the truth', () => {
      twoPlayerGameStarted((game, player1, player2) => {
        expect(() => {
          game.answer(player1.socketId, QUESTIONS[0].answer);
        }).to.throw(/TRUTH/);
      });
    });

    it('does not send choices when everybody has not answered', () => {
      twoPlayerGameStarted((game, player1, player2) => {
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
      twoPlayerGameStartedAnswered(ANSWERS, (game, player1, player2, choices) => {
        expect(choices).to.contain(TRUTH);
        done();
      });
    });

    it('containing unique choices', done => {
      twoPlayerGameStartedAnswered(ANSWERS, (game, player1, player2, choices) => {
        expect(choices.length).to.eql(_.uniq(choices).length);
        done();
      });
    });

    it('containing the answer of each player', done => {
      twoPlayerGameStartedAnswered(ANSWERS, (game, player1, player2, choices) => {
        expect(choices).to.contain(player1.lastAnswer);
        expect(choices).to.contain(player2.lastAnswer);
        done();
      });
    });
  });

  describe('when every player has chosen, sends the results', () => {
    const TRUTH = QUESTIONS[0].answer;

    it('giving 1000 points to each player who found the truth', done => {
      const answers = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const choices = { player1: TRUTH, player2: TRUTH + '2' };
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2) => {
        expect(player1.score).to.eql(1000);
        expect(player2.score).to.eql(0);
        done();
      });
    });

    it('giving 500 points to each player who authored a choice picked by others', done => {
      const answers = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const choices = { player1: TRUTH + '1', player2: TRUTH + '1' };
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2) => {
        expect(player1.score).to.eql(500);
        expect(player2.score).to.eql(0);
        done();
      });
    });

    it('giving 0 points to each player who picked his own choice', done => {
      const answers = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const choices = { player1: TRUTH + '1', player2: TRUTH + '2' };
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2) => {
        expect(player1.score).to.eql(0);
        expect(player2.score).to.eql(0);
        done();
      });
    });

    it('containing a result for the truth and who chose it', done => {
      const answers = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const choices = { player1: TRUTH, player2: TRUTH };
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2, results) => {
        expect(contains(results, { choice: TRUTH, authors: ['TRUTH'], choosedBy: [player1.name, player2.name] })).to.eql(true);
        done();
      });
    });

    it('containing a result for each player answer chosen by at least one person', done => {
      const answers = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const choices = { player1: TRUTH + '2', player2: TRUTH + '1' };
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2, results) => {
        expect(contains(results, { choice: choices.player2, authors: [player1.name], choosedBy: [player2.name] })).to.eql(true);
        expect(contains(results, { choice: choices.player1, authors: [player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });

    it('not containing a result for player answers chosen by nobody', done => {
      const answers = { player1: TRUTH + '1', player2: TRUTH + '2' };
      const choices = { player1: TRUTH + '2', player2: TRUTH + '2' };
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2, results) => {
        assertResultsDoNotContainChoice(answers.player1, results);
        done();
      });
    });

    it('containing result with multiple authors if answer was authored by more than one player', done => {
      const answers = { player1: TRUTH + '1', player2: TRUTH + '1' };
      const choices = { player1: TRUTH + '1', player2: TRUTH };
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2, results) => {
        expect(contains(results, { choice: choices.player1, authors: [player1.name, player2.name], choosedBy: [player1.name] })).to.eql(true);
        done();
      });
    });
  });
});

const assertResultsDoNotContainChoice = (choice, results) => expect(results.filter(result => result.choice == choice).length).to.eql(0);

const twoPlayerGame = (callback) => {
  const game = Game.create(QUESTIONS);
  const player1 = newPlayer('bob');
  const player2 = newPlayer('alice');
  player2.socketId = 2;
  game.addPlayer(player1);
  game.addPlayer(player2);
  callback(game, player1, player2);
}

const twoPlayerGameStarted = (callback) => {
  twoPlayerGame((game, player1, player2) => {
    game.questions().take(1).subscribe(question => {
      callback(game, player1, player2, question);
    });
    game.start();
  });
}

const twoPlayerGameStartedAnswered = (answers, callback) => {
  twoPlayerGameStarted((game, player1, player2) => {
    game.choices().take(1).subscribe(choices => {
      callback(game, player1, player2, choices);
    });
    game.answer(player1.socketId, answers.player1);
    game.answer(player2.socketId, answers.player2);
  });
}

const twoPlayerGameStartedAnsweredChosen = (answers, choices, callback) => {
  twoPlayerGameStartedAnswered(answers, (game, player1, player2) => {
    game.results().take(1).subscribe(results => {
      callback(game, player1, player2, results);
    });
    game.choose(player1.socketId, choices.player1);
    game.choose(player2.socketId, choices.player2);
  });
}

// Tests if an array contains a matching objects
// expect.to.contain only work for primitives
const contains = (array, object) => _.some(array, element => _.isEqual(element, object));
