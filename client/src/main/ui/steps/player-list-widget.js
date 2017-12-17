var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

exports.render = (container, players) => {
  precondition(container, 'Player list widget requires a container');
  precondition(players, 'Player list widget requires an array of players');

  if (players.length === 0) {
    container.append('div')
      .classed({
        'text-center': true,
        'no-player': true
      })
      .text(i18n.NO_CONNECTED_PLAYERS);

    return;
  }

  container.append('ul')
    .classed('players', true)
    .selectAll('.player')
    .data(players)
    .enter()
    .append('li')
    .classed('player', true)
    .append('span')
    .attr('data-player', player => player)
    .text(player => player);
}
