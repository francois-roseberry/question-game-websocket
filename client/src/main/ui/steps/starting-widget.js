var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

exports.render = (container, task, secondsRemaining, isObserver) => {
  precondition(container, 'Starting widget requires a container');
	precondition(task, 'Starting widget requires a game task');
  precondition(_.isNumber(secondsRemaining), 'Starting widget requires the number of seconds remaining');
  precondition(_.isBoolean(isObserver), 'Starting widget requires an observer flag');

	container.append('p')
		.classed({
			'game-starting': true,
			'observer': isObserver
		})
		.text(i18n.STARTING_SOON.replace('{seconds}', secondsRemaining));

	if (window['Audio'] && isObserver && secondsRemaining > 0) {
		var snd = new Audio("sounds/A_tone.mp3");
		snd.play();
	}

	if (!isObserver) {
		var btnCancel = container.append('button')
			.classed({
				'btn': true,
				'btn-primary': true,
				'btn-lg': true,
				'btn-cancel': true
			})
			.text(i18n.CANCEL)
			.on('click', () => {
				task.cancelStart();
			});

		$(btnCancel[0]).focus();
	}
}
