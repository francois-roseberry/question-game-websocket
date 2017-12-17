var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

var FORBIDDEN_CHARS = "!@£/\"\\$%?¢¤¬&*²¦²³";

exports.render = (container, task, error) => {
  precondition(container, 'Player login widget requires a container');
	precondition(task, 'Player login widget requires a game task');

	if (error) {
		container.append('div')
			.classed({
				'name-error': true,
				'alert': true,
				'alert-danger': true
			})
			.text(i18n['NAME_ERROR_' + error]);
	}

	var form = container.append('div')
		.classed('form-group', true);

	form.append('label')
		.attr('for', 'txtPlayerName')
		.text(i18n.PLAYER_NAME_LABEL)
		.classed('lbl-player-name', true);

	var txtPlayerName = form.append('input')
		.attr({
			id: 'txtPlayerName',
			type: 'text',
			placeholder: i18n.PLAYER_NAME_CUE,
			maxlength: 15
		})
		.classed({
			'txt-player-name': true,
			'form-control': true
		});

	$(txtPlayerName[0]).keypress(({ which }) => {
		var chr = String.fromCharCode(which);
		if (FORBIDDEN_CHARS.indexOf(chr) > 0) {
			return false;
		}
	});

	var btnJoin = container.append('button')
		.attr('disabled', true)
		.classed({
			'btn': true,
			'btn-primary': true,
			'btn-lg': true,
			'btn-join-game': true
		})
		.text(i18n.JOIN_GAME)
		.on('click', () => {
			var playerName = $(txtPlayerName[0]).val();
			task.setPlayerName(playerName);
		});

	$(txtPlayerName[0]).on('input', () => {
		var hasText = $(txtPlayerName[0]).val() !== "";
		if (hasText) {
			$(btnJoin[0]).removeAttr('disabled');
		} else {
			$(btnJoin[0]).attr('disabled', true);
		}
	});

	$(txtPlayerName[0]).on('keyup', ({ keyCode }) => {
		if (keyCode === 13) {
			$(btnJoin[0]).click();
		}
	});

	$(txtPlayerName[0]).focus();

	container.append('br');
	container.append('br');
	container.append('br');

	container.append('button')
		.classed({
			'btn': true,
			'btn-primary': true,
			'btn-lg': true,
			'btn-observer': true
		})
		.text(i18n.OBSERVE)
		.on('click', () => {
			task.setObserver();
		});
}
