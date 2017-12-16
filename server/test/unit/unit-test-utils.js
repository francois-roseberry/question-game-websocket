const Rx = require('rx');
const _ = require('underscore');
const expect = require('chai').expect;

const Game = require('../../src/game').Game;
const newPlayer = require('../../src/player').newPlayer;

exports.QUESTIONS = [
  { question: 'A ?', answer: '1'},
  { question: 'B ?', answer: '1'},
  { question: 'C ?', answer: '1'}
];

exports.CONFIG = {
  questions: exports.QUESTIONS,
  secondsBeforeStart: 5,
  secondsAfterScore: 5,
  secondsBetweenResults: 5,
  millisecondsPerSecond: 5 // we put 5 for testing so we have quasi-instant events
};

exports.assertResultsDoNotContainChoice = (choice, results) => expect(results.filter(result => result.choice == choice).length).to.eql(0);

exports.GameCreator = {
  create: () => Game.create(exports.CONFIG)
}

const game = callback => {
  const game = exports.GameCreator.create();
  const player1 = newPlayer('bob');
  const player2 = newPlayer('alice');
  player2.socketId = 2;
  game.addPlayer(player1);
  game.addPlayer(player2);
  callback(game, player1, player2);
}

exports.gameStarted = callback => {
  game((game, player1, player2) => {
    game.questions().take(1).subscribe(question => {
      callback(game, player1, player2, question);
    });
    game.start();
  });
}

exports.gameStartedAnswered = (answers, callback) => {
  exports.gameStarted((game, player1, player2) => {
    game.choices().take(1).subscribe(choices => {
      callback(game, player1, player2, choices);
    });
    game.answer(player1.socketId, answers.player1);
    game.answer(player2.socketId, answers.player2);
  });
}

exports.gameStartedAnsweredChosen = (answers, choices, callback) => {
  gameStartedAnsweredChosen(answers, choices, 3, callback);
}

exports.gameStartedAnsweredChosenWithTwoResults = (answers, choices, callback) => {
  gameStartedAnsweredChosen(answers, choices, 2, callback);
}

exports.gameStartedAnsweredChosenWithTruthOnly = (answers, choices, callback) => {
  gameStartedAnsweredChosen(answers, choices, 1, callback);
}

const gameStartedAnsweredChosen = (answers, choices, resultsCount, callback) => {
  exports.gameStartedAnswered(answers, (game, player1, player2) => {
    game.results().take(resultsCount).toArray().subscribe(results => {
      game.scores().take(1).subscribe(scores => {
        callback(game, player1, player2, results, scores);
      });
    });
    game.choose(player1.socketId, choices.player1);
    game.choose(player2.socketId, choices.player2);
  });
}

exports.gameCompleted = (answers, choices, callback) => {
  exports.gameStartedAnsweredChosen(answers, choices, (game, player1, player2) => {
    game.answer(player1.socketId, answers.player1);
    game.answer(player2.socketId, answers.player2);
    game.choose(player1.socketId, choices.player1);
    game.choose(player2.socketId, choices.player2);

    game.answer(player1.socketId, answers.player1);
    game.answer(player2.socketId, answers.player2);

    game.scores().take(1).subscribe(scores => {
      callback(game, player1, player2, scores);
    });

    game.choose(player1.socketId, choices.player1);
    game.choose(player2.socketId, choices.player2);
  });
}

// Tests if an array contains a matching objects
// expect.to.contain only work for primitives
exports.contains = (array, object) => _.some(array, element => _.isEqual(element, object));
