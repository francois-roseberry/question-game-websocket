var expect = require('chai').expect;
var TestUtils = require('./test-utils');

describe('A player joining', () => {
	it('cannot have the same name as an existing player', function (done) {
		this.timeout(1000);

		const NAME = 'Bob';

		TestUtils.connectPlayers([NAME, NAME], players => {
			var player2 = players[1];
			player2.once('name response', (success, error) => {
				expect(success).to.eql(false);
				expect(error).to.eql('EXISTING');
				done();
			});
		});
	});
});
