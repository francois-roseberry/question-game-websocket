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
	game.questions().subscribe(({ index, question }) => {
		log('sending question : ', question);
		io.emit('question', question, index + 1, questions.length);
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
		io.emit('scores', scores);
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
			log('User cannot join : ', error);
			socket.emit('name response', false, error);
		}

		/*if (gameStarted) {
			log('A user cannot join because game is aleady started');
			socket.emit('name response', false, 'ALREADY_STARTED');
			return;
		}

		var names = _.map(players, (player) => {
			return player.name;
		});
		if (_.contains(names, name)) {
			log('A user cannot join because name (' + name + ') already exists');
			socket.emit('name response', false, 'EXISTING');
		} else {
			log('A user identified as [' + name + "]");
			players[socket.id] = newPlayer(name);
			socket.emit('name response', true);
			var names = _.map(players, (player) => {
				return player.name;
			});
			io.emit('players', names);
		}*/
	};
}

function onStart(socket, game, questions) {
	return () => {
		try {
			game.start();
			log('Game started by [' + game.playerName(socket.id) + ']');
		} catch (error) {
			log('Could not start game : ', error);
		}

		/*if (!players[socket.id]) {
			log('Game cannot be started by a player who is not logged in');
			return;
		}

		log('Game started by [' + players[socket.id].name + ']');
		countdown(countdownObject, secondsBeforeStart, () => {
			gameStarted = true;
			log('Game start, sending first question');
			io.emit('question', questions[0].question, 1, questions.length);
		});*/
	};
}

function onCancel(socket, game) {
	return () => {
		const cancelled = game.cancel();
		if (cancelled) {
			log('Game start cancelled by [' + game.playerName(socket.id) + ']');
			socket.emit('cancelled');
		}

		/*if (!players[socket.id]) {
			log('Game cannot be cancelled by a user who is not logged in');
			return
		}

		if (countdownObject.timer) {
			log('Game start cancelled by [' + players[socket.id].name + ']');
			clearTimeout(countdownObject.timer);
			countdownObject.timer = null;

			var names = _.map(players, (player) => {
				return player.name;
			});
			io.emit('players', names);
		}*/
	};
}

function onAnswer(socket, game, questions) {
	return answer => {
		try {
			game.answer(socket.id, answer);
			log('Player [' + game.playerName(socket.id) + '] has answered ' + answer);
			socket.emit('answer response', true);
		} catch (error) {
			log('Could not answer : ', error);
			socket.emit('answer response', false, error);
		}
		/*if (!players[socket.id]) {
			log('Question cannot be answered by a user who is not logged in');
			return;
		}

		var truth = questions[questionIndex].answer;
		if (answer === truth) {
			socket.emit('answer response', false, 'TRUTH');
		} else {
			log('Player [' + players[socket.id].name + '] has answered ' + answer);
			players[socket.id].lastAnswer = answer;
			socket.emit('answer response', true);
			if (hasEveryPlayerAnswered()) {
				var choices = computeChoices(truth);
				shuffle(choices);
				log('Everybody has answered, sending choices : ' + JSON.stringify(choices));
				io.emit('choices', choices);
			}
		}*/
	};
}

function onChoice(socket, game, questions) {
	return choice => {
		game.choose(socket.id, choice);
		log('Player [' + game.playerName(socket.id) + '] has choosen ' + choice);

		/*if (!players[socket.id]) {
			log('A choice cannot be made by a player who is not logged in');
			return;
		}

		log('Player [' + players[socket.id].name + '] has choosen ' + choice);
		players[socket.id].lastChoice = choice;
		if (hasEveryPlayerChosen()) {
			log('Everybody has chosen, computing scores');

			var truth = questions[questionIndex].answer;
			var resultsMap = {};
			resultsMap[truth] = { authors: ['TRUTH'], choosedBy: []};

			_.each(players, (player) => {
				resultsMap[player.lastAnswer] = getResult(resultsMap, player);
			});

			_.each(players, (player) => {
				// If choice is the truth, give 1000 points to that player
				// and add that player in its list of choosers
				if (player.lastChoice === truth) {
					player.score += POINTS_FOR_TRUTH;
					resultsMap[truth].choosedBy.push(player.name);
				} else {
					// Otherwise, find out who created the choice and give each author 500 points
					_.each(players, (potentialAuthor) => {
						// Do not give points to a player who picks his own answer
						if (potentialAuthor.name !== player.name && potentialAuthor.lastAnswer === player.lastChoice) {
							potentialAuthor.score += POINTS_FOR_LIE;
						}
					});
					// and add this player to the list of choosers of that choice
					resultsMap[player.lastChoice].choosedBy.push(player.name);
				}
			});

			resultsMap = removeUnpickedChoices(resultsMap, truth);
			var results = placeResultsIntoArray(resultsMap, truth);

			sendResultsOneByOne(0, results, () => {
				log(scoresArray());
				questionIndex++;
				var isFinal = (questionIndex === questions.length);
				io.emit('scores', scoresArray(), isFinal);

				var scoreCooldownTimer = setTimeout(() => {
					if (questionIndex < questions.length) {
						log('Sending next question');
						resetAnswers();
						io.emit('question', questions[questionIndex].question, questionIndex + 1, questions.length);
					} else {
						log('Game finished, no more questions');
						gameEnded = true;
					}
				}, TIME_AFTER_SCORES);
			});
		}*/
	};
}

/*function sendResultsOneByOne(index, results, callback) {
	if (index === results.length) {
		log('No more results to send');
		callback();
		return;
	}

	log('Sending result : ' + JSON.stringify(results[index]));
	io.emit('result', results[index]);

	resultCooldownTimer = setTimeout(() => {
		sendResultsOneByOne(index + 1, results, callback);
	}, TIME_BETWEEN_RESULTS);
}

function placeResultsIntoArray(resultsMap, truth) {
	var results = [];
	_.each(_.keys(resultsMap), (choice) => {
		if (resultsMap[choice].authors[0] !== 'TRUTH') {
			results.push({
				choice: choice,
				authors: resultsMap[choice].authors,
				choosedBy: resultsMap[choice].choosedBy
			});
		}
	});
	// Insert truth at the end
	results.push({
		choice: truth,
		authors: ['TRUTH'],
		choosedBy: resultsMap[truth].choosedBy
	});
	return results;
}

function removeUnpickedChoices(resultsMap, truth) {
	var newResultsMap = {};
	_.each(_.keys(resultsMap), (choice) => {
		if (choice === truth || (choice !== truth && resultsMap[choice].choosedBy.length > 0)) {
			newResultsMap[choice] = resultsMap[choice];
		}
	});
	return newResultsMap;
}

function getResult(resultsMap, player) {
	if (resultsMap[player.lastAnswer]) {
		var result = resultsMap[player.lastAnswer];
		result.authors.push(player.name);
		return result;
	}

	return {authors: [player.name], choosedBy:[]};
}

function scoresArray() {
	return _.map(players, (player) => {
		return {
			name: player.name,
			score: player.score
		};
	});
}*/

function onDisconnect(socket, game) {
	return () => {
		game.removePlayer(socket.id);

		/*if (players[socket.id]) {
			log('Player [' + players[socket.id].name + '] has left');
			gameStarted = false;
			if (countdownObject.timer && !gameEnded) {
				clearGameTimers();
				gameEnded = true;
				io.emit('quit', players[socket.id].name);
			}

			delete players[socket.id];

			if (!gameStarted && !gameEnded) {
				var names = _.map(players, (player) => {
					return player.name;
				});
				io.emit('players', names);
			}
		}*/
	};
}


/*function clearGameTimers() {
	if (countdownObject.timer) {
		clearTimeout(countdownObject.timer);
		countdownObject.timer = null;
	}
	if (resultCooldownTimer) {
		clearTimeout(resultCooldownTimer);
		resultCooldownTimer = null;
	}
	if (scoreCooldownTimer) {
		clearTimeout(scoreCooldownTimer);
		scoreCooldownTimer = null;
	}
}*/

/*function resetAnswers() {
	_.each(players, (player) => {
		player.lastAnswer = null;
		player.lastChoice = null;
	});
}

function computeChoices(truth) {
	var answers = _.map(players, (player) => {
		return player.lastAnswer;
	});

	return _.uniq(answers).concat([truth]);
}

function hasEveryPlayerChosen() {
	return _.every(players, (player) => {
		return player.lastChoice != null;
	});
}

function hasEveryPlayerAnswered() {
	return _.every(players, (player) => {
		return player.lastAnswer != null;
	});
}

function countdown(countdownObject, seconds, callback) {
	log('starting in ' + seconds + ' seconds');
	io.emit('starting', seconds);
	if (seconds === 0) {
		countdownObject.timer = null;
		callback();
		return;
	}

	countdownObject.timer = setTimeout(() => {
		countdown(countdownObject, seconds - 1, callback);
	}, 1000);
}*/

http.listen(PORT, () => {
	log('Question game server listening on port ' + PORT);
});
