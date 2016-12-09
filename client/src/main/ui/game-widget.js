(function() {
	"use strict";
	
	var i18n = require('./i18n').i18n();
	var precondition = require('./contract').precondition;
	
	var FORBIDDEN_CHARS = "!@£/\"\\$%?¢¤¬&*²¦²³";
	
	exports.render = function (container, task) {
		precondition(container, 'Game widget requires a container');
		precondition(task, 'Game widget requires a game task');
		
		
		var widgetContainer = d3.select(container[0]).append('div');
		
		task.status().subscribe(function (status) {
			widgetContainer.selectAll('*').remove();
			status.match({
				initial: showPlayerLogin(widgetContainer, task),
				before: showStartButton(widgetContainer, task),
				starting: showStartingControls(widgetContainer, task),
				question: showQuestion(widgetContainer, task),
				waiting: showWaiting(widgetContainer),
				choosing: showChoices(widgetContainer, task)
			});
		});
	};
	
	function showPlayerLogin(widgetContainer, task) {
		return function () {
			var txtPlayerName = widgetContainer.append('input')
				.attr({
					type: 'text',
					placeholder: i18n.PLAYER_NAME_CUE,
					maxlength: 10
				})
				.classed({
					'txt-player-name': true,
					'form-control': true
				});
				
			$(txtPlayerName[0]).keypress(function (e) {
				var chr = String.fromCharCode(e.which);
				if (FORBIDDEN_CHARS.indexOf(chr) > 0) {
					return false;
				}
			});
				
			var btnJoin = widgetContainer.append('button')
				.classed({
					'btn-join-game': true,
					'btn': true,
					'btn-primary': true
				})
				.text(i18n.JOIN_GAME)
				.on('click', function () {
					var playerName = $(txtPlayerName[0]).val();
					task.setPlayerName(playerName);
				});
				
			$(txtPlayerName[0]).on('keyup', function (e) {
				if (e.keyCode === 13) {
					$(btnJoin[0]).click();
				}
			});
			
			$(txtPlayerName[0]).focus();
		};
	}
	
	function showStartButton(widgetContainer, task) {
		return function () {
			var btnStart = widgetContainer.append('button')
				.classed({
					'btn-start-game': true,
					'btn': true,
					'btn-primary': true
				})
				.text(i18n.START_GAME)
				.on('click', function () {
					task.startGame();
				});
				
			$(btnStart[0]).focus();
		};
	}
	
	function showStartingControls(widgetContainer, task) {
		return function (secondsRemaining) {
			widgetContainer.append('p')
				.classed('game-starting', true)
				.text(i18n.STARTING_SOON.replace('{seconds}', secondsRemaining));
			
			var btnCancel = widgetContainer.append('button')
				.classed({
					'btn-cancel': true,
					'btn': true,
					'btn-primary': true
				})
				.text(i18n.CANCEL)
				.on('click', function () {
					task.cancelStart();
				});
				
			$(btnCancel[0]).focus();
		};
	}
	
	function showQuestion(widgetContainer, task) {
		return function (question) {
			widgetContainer.append('p')
				.classed('question', true)
				.text(question);
				
			var txtAnswer = widgetContainer.append('input')
				.attr({
					type: 'text',
					placeholder: i18n.ANSWER_CUE,
					maxlength: 10
				})
				.classed({
					'txt-answer': true,
					'form-control': true
				});
				
			var btnSubmit = widgetContainer.append('button')
				.classed({
					'btn-submit-answer': true,
					'btn': true,
					'btn-primary': true
				})
				.text(i18n.SUBMIT_ANSWER)
				.on('click', function () {
					var answer = $(txtAnswer[0]).val();
					task.submitAnswer(answer);
				});
				
			$(txtAnswer[0]).on('keyup', function (e) {
				if (e.keyCode === 13) {
					$(btnSubmit[0]).click();
				}
			});
				
			$(txtAnswer[0]).focus();
		};
	}
	
	function showWaiting(widgetContainer) {
		return function () {
			widgetContainer.append('p')
				.classed('waiting', true)
				.text(i18n.WAITING);
		};
	}
	
	function showChoices(widgetContainer, task) {
		return function (choices) {
			widgetContainer
				.selectAll('.btn-choice')
				.data(choices)
				.enter()
				.append('button')
				.classed('btn-choice', true)
				.attr('data-index', function (choice, index) {
					return index;
				})
				.text(function (choice) {
					return choice;
				})
				.on('click', function (choice, index) {
					task.submitChoice(index);
				});
		};
	}
}());
