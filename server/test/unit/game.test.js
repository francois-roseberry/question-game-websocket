var expect = require('chai').expect;
var _ = require('underscore');

var Game = require('../../src/game').Game;
var newPlayer = require('../../src/player').newPlayer;

describe('A game', () => {
  const QUESTIONS = [
    { question: 'A ?', answer: '1'},
    { question: 'B ?', answer: '2'},
    { question: 'C ?', answer: '3'}
  ];
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
    it('sends the first question', done => {
      twoPlayerGame((game, player1, player2) => {
        game.questions().subscribe(question => {
          expect(question).to.eql(QUESTIONS[0].question);
          done();
        });

        game.start();
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
    it('containing the truth', done => {
      twoPlayerGameStarted((game, player1, player2) => {
        game.choices().subscribe(choices => {
          expect(_.contains(choices, QUESTIONS[0].answer)).to.eql(true);
          done();
        });

        game.answer(player1.socketId, QUESTIONS[0].answer + '1');
        game.answer(player2.socketId, QUESTIONS[0].answer + '1');
      });
    });

    it('containing unique choices', done => {
      twoPlayerGameStarted((game, player1, player2) => {
        game.choices().subscribe(choices => {
          expect(choices.length).to.eql(_.uniq(choices).length);
          done();
        });

        game.answer(player1.socketId, QUESTIONS[0].answer + '1');
        game.answer(player2.socketId, QUESTIONS[0].answer + '1');
      });
    });

    it('containing the answer of each player', done => {
      twoPlayerGameStarted((game, player1, player2) => {
        game.choices().subscribe(choices => {
          expect(_.contains(choices, player1.lastAnswer)).to.eql(true);
          expect(_.contains(choices, player2.lastAnswer)).to.eql(true);
          done();
        });

        game.answer(player1.socketId, QUESTIONS[0].answer + '1');
        game.answer(player2.socketId, QUESTIONS[0].answer + '1');
      });
    });
  });

  describe('when every player has chosen, sends the results', () => {
    it('giving 1000 points to each player who found the truth', () => {
      const answers = { player1: QUESTIONS[0].answer + '1', player2: QUESTIONS[0].answer + '1'};
      const choices = { player1: QUESTIONS[0].answer, player2: QUESTIONS[0].answer + '2'};
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2) => {
        expect(player1.score).to.eql(1000);
        expect(player2.score).to.eql(0);
      });
    });

    it('giving 500 points to each player who authored a choice picked by others', () => {
      const answers = { player1: QUESTIONS[0].answer + '1', player2: QUESTIONS[0].answer + '2'};
      const choices = { player1: QUESTIONS[0].answer + '3', player2: QUESTIONS[0].answer + '1'};
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2) => {
        expect(player1.score).to.eql(500);
        expect(player2.score).to.eql(0);
      });
    });

    it('giving 0 points to each player who picked his own choice', () => {
      const answers = { player1: QUESTIONS[0].answer + '1', player2: QUESTIONS[0].answer + '2'};
      const choices = { player1: QUESTIONS[0].answer + '1', player2: QUESTIONS[0].answer + '2'};
      twoPlayerGameStartedAnsweredChosen(answers, choices, (game, player1, player2) => {
        expect(player1.score).to.eql(0);
        expect(player2.score).to.eql(0);
      });
    });
  });

  function twoPlayerGame(callback) {
    const game = Game.create(QUESTIONS);
    const player1 = newPlayer('bob');
    const player2 = newPlayer('alice');
    player2.socketId = 2;
    game.addPlayer(player1);
    game.addPlayer(player2);
    callback(game, player1, player2);
  }

  function twoPlayerGameStarted(callback) {
    twoPlayerGame((game, player1, player2) => {
      game.start();
      callback(game, player1, player2);
    });
  }

  function twoPlayerGameStartedAnswered(answers, callback) {
    twoPlayerGameStarted((game, player1, player2) => {
      game.answer(player1.socketId, answers.player1);
      game.answer(player2.socketId, answers.player2);
      callback(game, player1, player2);
    });
  }

  function twoPlayerGameStartedAnsweredChosen(answers, choices, callback) {
    twoPlayerGameStartedAnswered(answers, (game, player1, player2) => {
      game.choose(player1.socketId, choices.player1);
      game.choose(player2.socketId, choices.player2);
      callback(game, player1, player2);
    });
  }
});
