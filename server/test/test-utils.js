exports.connectPlayer = function (io, url, options, name, callback) {
	var player = io.connect(url, options);
	
	player.on('connect', function () {
		player.emit('name', name);
		
		callback(player);
	});
};

exports.connectPlayers = function (io, url, options, names, callback) {
	connectPlayers(io, url, options, names, [], callback);
};

function connectPlayers(io, url, options, names, players, callback) {
	if (names.length === 0) {
		callback(players);
		return;
	}
	
	exports.connectPlayer(io, url, options, names[0], function (player) {
		players.push(player);
		connectPlayers(io, url, options, names.slice(1), players, callback);
	});
}

exports.disconnectPlayers = function (players) {
	players.forEach(function (player) {
		player.disconnect();
	});
};