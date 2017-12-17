var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var program = require('commander');
var _ = require('underscore');
var fs = require('fs');
var log = require('debug')('question-game');

var shuffle = require('./src/util').shuffle;
var newPlayer = require('./src/player').newPlayer;
const Game = require('./src/game').Game;

const PORT = 3000;
const SECONDS_BEFORE_START = 5;

/*var POINTS_FOR_TRUTH = 1000;
var POINTS_FOR_LIE = 500;

var TIME_BETWEEN_RESULTS = 5000;
var TIME_AFTER_SCORES = 5000;
var SECONDS_BEFORE_START = 5;

var countdownObject = {};
var resultCooldownTimer = null;
var scoreCooldownTimer = null;
var players = {};
var questionIndex = 0;*/

// TODO : replace these variables with a state variable
// BEFORE, STARTING, STARTED, ENDED, and eventually PAUSED, but for now quitting stops the game and doesn't pause
/*var gameStarted = false;
var gameEnded = false;*/

program
	.version('0.1')
	.option('-w, --webclient <directory>', 'The directory served')
	.option('-q, --question <file>', 'The question file')
	.option('-c, --countdown [seconds]', 'Countdown to start in seconds. Must be greater than 0. Default value of 5 if not present')
	.parse(process.argv);

//const secondsBeforeStart = validCountdown(program.countdown);

fs.readFile(program.question, 'utf-8', (err, data) => {
	if (err) {
		log('Could not read question file');
		return;
	}

	const secondsBeforeStart = validCountdown(program.countdown);

	app.use(express.static(program.webclient));
	io.on('connection', onConnect(secondsBeforeStart, JSON.parse(data)));
});

const validCountdown = countdown => {
	if (countdown && countdown > 0) {
		return countdown;
	}

	return SECONDS_BEFORE_START;
}

function onConnect(secondsBeforeStart, questions) {
	const game = Game.create({
		questions,
		secondsBeforeStart: secondsBeforeStart,
	  secondsAfterScore: 5,
	  secondsBetweenResults: 5,
	  millisecondsPerSecond: 1000
	});

  game.players().subscribe(players => {
		log('sending list of players : ', players);
		io.emit('players', players);
	});
	game.playerQuit().subscribe(playerName => {
		log('player [' + playerName + '] has left');
		io.emit('quit', playerName);
	});
	game.questions().subscribe(({ index, question, playerCount }) => {
		log('sending question : ', question);
		io.emit('question', question, index + 1, questions.length, playerCount);
	});
	game.starting().subscribe(seconds => {
		log('starting in ', seconds, ' seconds');
		io.emit('starting', seconds);
	});
	game.choices().subscribe(choices => {
		log('sending choices : ', choices);
		io.emit('choices', choices);
	});
	game.results().subscribe(result => {
		log('sending result : ', result);
		io.emit('result', result);
	});
	game.scores().subscribe(scores => {
		log('sending scores : ', scores);
		io.emit('scores', scores.array, scores.final);
	});
	game.answerState().subscribe(answerState => {
		log('answer state : ', answerState);
		io.emit('answer state', answerState);
	});
	game.choiceState().subscribe(choiceState => {
		log('choice state : ', choiceState);
		io.emit('choiceState', choiceState);
	});

	return socket => {
		socket.on('name', onPlayerName(socket, game));
		socket.on('start', onStart(socket, game, questions));
		socket.on('cancel', onCancel(socket, game));
		socket.on('answer', onAnswer(socket, game, questions));
		socket.on('choice', onChoice(socket, game, questions));
		socket.on('disconnect', onDisconnect(socket, game));
	};
}

function onPlayerName(socket, game) {
	return name => {
		try {
			const player = newPlayer(name);
			player.socketId = socket.id;
			game.addPlayer(player);
			log('A user identified as [' + name + "]");
			socket.emit('name response', true);
		} catch (error) {
			log('User cannot join : ', error.message);
			socket.emit('name response', false, error.message);
		}
	};
}

function onStart(socket, game, questions) {
	return () => {
		try {
			game.start();
			log('Game started by [' + game.playerName(socket.id) + ']');
		} catch (error) {
			log('Could not start game : ', error.message);
		}
	};
}

function onCancel(socket, game) {
	return () => {
		const cancelled = game.cancel();
		if (cancelled) {
			log('Game start cancelled by [' + game.playerName(socket.id) + ']');
			socket.emit('cancelled');
		}
	};
}

function onAnswer(socket, game, questions) {
	return answer => {
		try {
			game.answer(socket.id, answer);
			log('Player [' + game.playerName(socket.id) + '] has answered ' + answer);
			socket.emit('answer response', true);
		} catch (error) {
			log('Could not answer : ', error.message);
			socket.emit('answer response', false, error.message);
		}
	};
}

function onChoice(socket, game, questions) {
	return choice => {
		game.choose(socket.id, choice);
		log('Player [' + game.playerName(socket.id) + '] has choosen ' + choice);
	};
}

function onDisconnect(socket, game) {
	return () => {
		game.removePlayer(socket.id);
	};
}

http.listen(PORT, () => {
	log('Question game server listening on port ' + PORT);
});
