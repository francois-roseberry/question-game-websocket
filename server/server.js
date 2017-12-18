const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const program = require('commander');
const _ = require('underscore');
const fs = require('fs');
const log = require('debug')('question-game');

const QuestionBank = require('./src/question-bank').QuestionBank;
const shuffle = require('./src/util').shuffle;
const newPlayer = require('./src/player').newPlayer;
const Game = require('./src/game').Game;

const PORT = 3000;
const SECONDS_BEFORE_START = 5;

program
	.version('0.1')
	.option('-w, --webclient <directory>', 'The directory served')
	.option('-q, --question <file>', 'The question file')
	.option('-c, --countdown [seconds]', 'Countdown to start in seconds. Must be greater than 0. Default value of 5 if not present')
	.parse(process.argv);

fs.readFile(program.question, 'utf-8', (err, data) => {
	if (err) {
		log('Could not read question file');
		return;
	}

	const secondsBeforeStart = validCountdown(program.countdown);

	app.use(express.static(program.webclient));
	const bank = QuestionBank.read(data);
	io.on('connection', onConnect(secondsBeforeStart, bank));
});

const validCountdown = countdown => {
	if (countdown && countdown > 0) {
		return countdown;
	}

	return SECONDS_BEFORE_START;
}

const onConnect = (secondsBeforeStart, questionBank) => {
	const game = Game.create({
		questionBank,
		secondsBeforeStart: secondsBeforeStart,
	  secondsAfterScore: 5,
	  secondsBetweenResults: 5,
	  millisecondsPerSecond: 1000
	});

  attachGameOutput(game, io, questionBank);

	return socket => {
		socket.on('name', onPlayerName(socket, game));
		socket.on('start', onStart(socket, game));
		socket.on('cancel', onCancel(socket, game));
		socket.on('answer', onAnswer(socket, game));
		socket.on('choice', onChoice(socket, game));
		socket.on('disconnect', onDisconnect(socket, game));
	};
}

const attachGameOutput = (game, io, questionBank) => {
	game.players().subscribe(players => {
		log('sending list of players : ', players);
		io.emit('players', players);
	});
	game.playerQuit().subscribe(playerName => {
		log('player [' + playerName + '] has left');
		io.emit('quit', playerName);
	});
	game.questions().subscribe(({ index, question, playerCount }) => {
		log('sending question ', index + 1, '/', questionBank.size(), ' : ', question);
		io.emit('question', question, index + 1, questionBank.size(), playerCount);
	});
	game.starting().subscribe(seconds => {
		log('starting in ', seconds, ' seconds');
		io.emit('starting', seconds);
	});
	game.choices().subscribe(({ choices, playerCount }) => {
		log('sending choices : ', choices);
		io.emit('choices', choices, playerCount);
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
		io.emit('choice state', choiceState);
	});
};

const onPlayerName = (socket, game) => name => {
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

const onStart = (socket, game) => () => {
	try {
		game.start();
		log('Game started by [' + game.playerName(socket.id) + ']');
	} catch (error) {
		log('Could not start game : ', error.message);
	}
};

const onCancel = (socket, game) => () => {
	const cancelled = game.cancel();
	if (cancelled) {
		log('Game start cancelled by [' + game.playerName(socket.id) + ']');
		socket.emit('cancelled');
	}
};

const onAnswer = (socket, game) => answer => {
	try {
		game.answer(socket.id, answer);
		log('Player [' + game.playerName(socket.id) + '] has answered ' + answer);
		socket.emit('answer response', true);
	} catch (error) {
		log('Could not answer : ', error.message);
		socket.emit('answer response', false, error.message);
	}
};

const onChoice = (socket, game) => choice => {
	game.choose(socket.id, choice);
	log('Player [' + game.playerName(socket.id) + '] has choosen ' + choice);
};

const onDisconnect = (socket, game) => () => {
	game.removePlayer(socket.id);
};

http.listen(PORT, () => {
	log('Question game server listening on port ' + PORT);
});
