var io = require('socket.io-client');

var socketUrl = 'http://localhost:3000';

var options = {
	transports: ['websocket'],
	'force new connection': true
};

describe('A full game', function () {
	var PLAYER1 = 'bob';
	var PLAYER2 = 'alice';
	var PLAYER3 = 'george';
	
	it('can be played', function (done) {
		this.timeout(10000);
		var player1 = io.connect(socketUrl, options);
		player1.on('connect', function () {
			player1.emit('name', PLAYER1);
			
			var player2 = io.connect(socketUrl, options);
			player2.on('connect', function () {
				player2.emit('name', PLAYER2);
				
				var player3 = io.connect(socketUrl, options);
				player3.on('connect', function () {
					player3.emit('name', PLAYER3);
					
					player3.once('name response', function () {
						player3.emit('start');
						
						player1.once('question', function () {
							player1.emit('answer', 'lie1');
						});
						player2.once('question', function () {
							player2.emit('answer', 'lie2');
						});
						player3.once('question', function () {
							player3.emit('answer', 'lie3');
							done();
						});
					});
				});
			});
		});
	});
});