var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

exports.render = (container, playerName) => {
  precondition(container, 'Quit widget requires a container');
	precondition(_.isString(playerName), 'Quit widget requires a player name');

  container.append('p')
    .classed('player-quit', true)
    .text(i18n.PLAYER_QUIT.replace('{player}', playerName));
}
