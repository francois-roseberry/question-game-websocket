var expect = require('chai').expect;
var _ = require('underscore');

var Game = require('../../src/game').Game;
var newPlayer = require('../../src/player').newPlayer;

describe('A game', () => {
  const QUESTIONS = [
    { question: 'A ?', truth: '1'},
    { question: 'B ?', truth: '2'},
    { question: 'C ?', truth: '3'}
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
      var game = Game.create(QUESTIONS);
      game.questions().subscribe(question => {
        expect(question).to.eql(QUESTIONS[0].question);
        done();
      });

      game.start();
    });
  });

  describe('answering a question', () => {
    it('throws an error if answer is the truth', () => {
      const game = Game.create(QUESTIONS);
      const player = newPlayer('bob');
      game.addPlayer(player);
      game.start();
      expect(() => {
        game.answer(player.socketId, QUESTIONS[0].answer);
      }).to.throw(/TRUTH/);
    });

    it('does not send choices when everybody has not answered', () => {
      const game = Game.create(QUESTIONS);

      game.choices().subscribe(choices => {
        fail();
      });

      const player1 = newPlayer('bob');
      game.addPlayer(player1);
      const player2 = newPlayer('alice');
      player2.socketId = 2;
      game.addPlayer(player2);
      game.start();
      game.answer(player1.socketId, QUESTIONS[0].answer + '1');
    })

    describe('when every player has answered, sends a choice array', () => {
      const game = Game.create(QUESTIONS);
      const player1 = newPlayer('bob');
      const player2 = newPlayer('alice');
      player2.socketId = 2;

      let choicesArray;

      game.choices().subscribe(choices => {
        choicesArray = choices;
      });

      game.addPlayer(player1);
      game.addPlayer(player2);
      game.start();
      game.answer(player1.socketId, QUESTIONS[0].answer + '1');
      game.answer(player2.socketId, QUESTIONS[0].answer + '1');

      it('containing the truth', () => {
        expect(_.contains(choicesArray, QUESTIONS[0].answer)).to.eql(true);
      });

      it('containing unique choices', () => {
        expect(choicesArray.length).to.eql(_.uniq(choicesArray).length);
      });

      it('containing the answer of each player', () => {
        expect(_.contains(choicesArray, player1.lastAnswer)).to.eql(true);
        expect(_.contains(choicesArray, player2.lastAnswer)).to.eql(true);
      });
    });
  });
});
