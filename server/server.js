var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var program = require('commander');
var _ = require('underscore');
var fs = require('fs');

var port = 3000;
var countdownObject = {};

var POINTS_FOR_TRUTH = 1000;
var POINTS_FOR_LIE = 500;

var players = {};

program
	.version('0.1')
	.option('-w, --webclient <directory>', 'The directory served')
	.option('-q, --question <file>', 'The question file')
	.parse(process.argv);
	
fs.readFile(program.question, 'utf-8', function (err, data) {
	if (err) {
		console.log('Could not read question file');
		return;
	}
	
	app.use(express.static(program.webclient));
	io.on('connection', onConnect(JSON.parse(data)));
});

function onConnect(questions) {
	return function (socket) {
		// TODO : if there's currently a game when the user connects, should return a message and close the socket
		// TODO : Save the client socket id and his name in an array of players, later will also contain the score
		
		socket.on('name', onPlayerName(socket));
		socket.on('start', onStart(socket, questions[0].question));
		socket.on('cancel', onCancel(socket));
		socket.on('answer', onAnswer(socket, questions[0].answer));
		socket.on('choice', onChoice(socket, questions[0].answer));
		socket.on('disconnect', onDisconnect(socket));
	};
}

function onPlayerName(socket) {
	return function (name) {
		var names = _.map(players, function (player) {
			return player.name;
		});
		if (_.contains(names, name)) {
			socket.emit('name response', false, 'EXISTING');
		} else {
			console.log('A user identified as [' + name + "]");
			players[socket.id] = {
				name: name,
				score: 0,
				lastAnswer: null,
				lastChoice: null
			};
			socket.emit('name response', true);
		}
	};
}

function onStart(socket, question) {
	return function () {
		console.log('Game started by [' + players[socket.id].name + ']');
		countdown(countdownObject, 5, function () {
			console.log('Game start, sending first question');
			io.emit('question', question);
		});
	};
}

function onCancel(socket) {
	return function () {
		if (countdownObject.timer) {
			console.log('Game start cancelled by [' + players[socket.id].name + ']');
			clearTimeout(countdownObject.timer);
			countdownObject.timer = null;
			io.emit('cancelled');
		}
	};
}

function onAnswer(socket, truth) {
	return function (answer) {
		if (answer === truth) {
			socket.emit('answer response', false, 'TRUTH');
		} else {
			console.log('Player [' + players[socket.id].name + '] has answered ' + answer);
			players[socket.id].lastAnswer = answer;
			socket.emit('answer response', true);
			if (hasEveryPlayerAnswered()) {
				var choices = computeChoices(truth);
				console.log('Everybody has answered, sending choices : ' + JSON.stringify(choices));
				io.emit('choices', choices);
			}
		}
	};
}

function onChoice(socket, truth) {
	return function (choice) {
		console.log('Player [' + players[socket.id].name + '] has choosen ' + choice);
		players[socket.id].lastChoice = choice;
		if (hasEveryPlayerChosen()) {
			// TODO calculate the scores
			console.log('Everybody has chosen, computing scores');
			
			_.each(players, function (player) {
				// If choice is the truth, give 1000 points to that player
				if (player.lastChoice === truth) {
					player.score += POINTS_FOR_TRUTH;
				} else {
					// Otherwise, find out who created the choice and give him (or them) 500
					_.each(players, function (potentialAuthor) {
						if (potentialAuthor.name !== player.name && potentialAuthor.lastAnswer === player.lastChoice) {
							potentialAuthor.score += POINTS_FOR_LIE;
						}
					});
				}
			});
			
			console.log(scoresArray());
			io.emit('scores', scoresArray());
			// TODO : wait a few seconds, then either show the next question (if any), or do nothing (end the game by letting scores show)
		}
	};
}

function scoresArray() {
	return _.map(players, function (player) {
		return {
			name: player.name,
			score: player.score
		};
	});
}

function onDisconnect(socket) {
	return function () {
		if (players[socket.id]) {
			console.log('Player [' + players[socket.id].name + '] has left');
			players[socket.id] = null;
		}
	};
}

function resetAnswers() {
	_.each(players, function (player) {
		player.lastAnswer = null;
	});
}

function computeChoices(truth) {
	var answers = _.map(players, function (player) {
		return player.lastAnswer;
	});
	
	return _.uniq(answers).concat([truth]);
}

function hasEveryPlayerChosen() {
	return _.every(players, function (player) {
		return player.lastChoice != null;
	});
}

function hasEveryPlayerAnswered() {
	return _.every(players, function (player) {
		return player.lastAnswer != null;
	});
}

function countdown(countdownObject, seconds, callback) {
	console.log('starting in ' + seconds + ' seconds');
	io.emit('starting', seconds);
	if (seconds === 0) {
		countdownObject.timer = null;
		callback();
		return;
	}
	
	countdownObject.timer = setTimeout(function () {
		countdown(countdownObject, seconds - 1, callback);
	}, 1000);
}

http.listen(port, function () {
	console.log('Question game server listening on port ' + port);
});
