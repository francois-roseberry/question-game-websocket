var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var program = require('commander');

var port = 3000;
var countdownObject = {};
var QUESTION = 'According to the Party in 1984, 2 + 2 = _';
var ANSWER = "5";

program
	.version('0.1')
	.option('-w, --webclient <directory>', 'The directory served')
	.parse(process.argv);

app.use(express.static(program.webclient));

io.on('connection', function(socket) {
	// TODO : if there's currently a game when the user connects, should return a message and close the socket
	// TODO : Save the client socket id and his name in an array of players, later will also contain the score
	
	var address = socket.handshake.address;
	console.log('A user connected from ' + address.address + ':' + address.port);
	socket.on('name', function (name) {
		console.log('A user identified as [' + name + "], name ok");
		socket.player = {
			name: name,
			score: 0,
			lastAnswer: null
		};
		// TODO : validate the name is unique
		socket.emit('name response', true);
	});
	
	socket.on('start', function () {
		console.log('Game started by ' + socket.player.name);
		countdown(countdownObject, 5, function () {
			console.log('Game start, sending question');
			// Start the game, send the first question
			io.emit('question', QUESTION);
		});
	});
	
	socket.on('cancel', function() {
		if (countdownObject.timer) {
			console.log('Game start cancelled by ' + socket.player.name);
			clearTimeout(countdownObject.timer);
			countdownObject.timer = null;
			io.emit('cancelled');
		}
	});
	
	socket.on('answer', function (answer) {
		if (answer == ANSWER) {
			socket.emit('answer response', false, ['TRUTH']);
		} else {
			console.log('Player ' + socket.player.name + ' has answered ' + answer);
			socket.player.lastAnswer = answer;
			socket.emit('answer response', true);
			// TODO : check if all players have answered (lastAnswer is non null)
			// If so, send back all the answers + the truth as choices
		}
	});
	
	socket.on('disconnect', function() {
		console.log('user disconnected');
	});
});

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
