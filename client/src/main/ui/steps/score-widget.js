var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

exports.render = (container, scores, isFinal) => {
  precondition(container, 'Score widget requires a container');
	precondition(_.isArray(scores), 'Score widget requires a game task');

  container.append('div')
    .classed('scores-header', true)
    .text(isFinal ? i18n.FINAL_SCORES : i18n.INTERMEDIATE_SCORES);

  var scoreElements = container.append('div')
    .classed('scores', true)
    .selectAll('.score')
    .data(scores)
    .enter()
    .append('div')
    .classed('score', true)
    .attr('data-player', score => score.name);

  scoreElements.append('span')
    .classed({
      'score-name': true,
      'pull-left': true
    })
    .text(score => score.name);

  scoreElements.append('span')
    .classed({
      'score-value': true,
      'pull-right': true
    })
    .text(score => score.score);
}
