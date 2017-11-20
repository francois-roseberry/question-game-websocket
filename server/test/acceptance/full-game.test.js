var TestUtils = require('./test-utils');

describe('A full game', () => {
	const PLAYER1 = 'bob';
	const PLAYER2 = 'alice';
	const PLAYER3 = 'george';

	it('can be played', function (done) {
		this.timeout(10000);
		TestUtils.connectPlayers([PLAYER1, PLAYER2, PLAYER3], ([player1, player2, player3]) => {
			player3.once('name response', () => {
				player3.emit('start');

				player1.once('question', () => {
					player1.emit('answer', 'lie1');
				});
				player2.once('question', () => {
					player2.emit('answer', 'lie2');
				});
				player3.once('question', () => {
					player3.emit('answer', 'lie3');

					// TODO have two players pick the same lie, chosen by the other, to see if both authors get +500

					TestUtils.disconnectPlayers([player1, player2, player3]);

					done();
				});
			});
		});
	});
});
