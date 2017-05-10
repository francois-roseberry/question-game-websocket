var TestUtils = require('./test-utils');

describe('A full game', function () {
	var PLAYER1 = 'bob';
	var PLAYER2 = 'alice';
	var PLAYER3 = 'george';

	it('can be played', function (done) {
		this.timeout(10000);
		TestUtils.connectPlayers([PLAYER1, PLAYER2, PLAYER3], function (players) {
			var player1 = players[0];
			var player2 = players[1];
			var player3 = players[2];
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

					// TODO have two players pick the same lie, chosen by the other, to see if both authors get +500

					TestUtils.disconnectPlayers([player1, player2, player3]);

					done();
				});
			});
		});
	});
});
