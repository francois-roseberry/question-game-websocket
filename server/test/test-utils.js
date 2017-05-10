var io = require('socket.io-client');
var url = 'http://localhost:3000';

var options = {
	transports: ['websocket'],
	'force new connection': true
};

exports.connectPlayer = function (name, callback) {
	var player = io.connect(url, options);

	player.on('connect', function () {
		player.emit('name', name);

		callback(player);
	});
};

exports.connectPlayers = function (names, callback) {
	connectPlayers(names, [], callback);
};

function connectPlayers(names, players, callback) {
	if (names.length === 0) {
		callback(players);
		return;
	}

	exports.connectPlayer(names[0], function (player) {
		players.push(player);
		connectPlayers(names.slice(1), players, callback);
	});
}

exports.disconnectPlayers = function (players) {
	players.forEach(function (player) {
		player.disconnect();
	});
};
