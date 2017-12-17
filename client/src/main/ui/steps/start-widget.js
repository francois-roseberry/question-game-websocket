var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

exports.render = (container, task) => {
  precondition(container, 'Start widget requires a container');
	precondition(task, 'Start widget requires a game task');

  var btnStart = container.append('button')
    .classed({
      'btn': true,
      'btn-primary': true,
      'btn-lg': true,
      'btn-start-game': true
    })
    .text(i18n.START_GAME)
    .on('click', () => {
      task.startGame();
    });

  $(btnStart[0]).focus();
}
