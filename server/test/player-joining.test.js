var expect = require('chai').expect;
var TestUtils = require('./test-utils');

describe('A player joining', function () {
	it('cannot have the same name as an existing player', function (done) {
		this.timeout(1000);

		var NAME = 'Bob';

		TestUtils.connectPlayer(NAME, function () {
			TestUtils.connectPlayer(NAME, function (player2) {
				player2.once('name response', function (success, error) {
					expect(success).to.eql(false);
					expect(error).to.eql('EXISTING');
					done();
				});
			});
		});
	});
});
