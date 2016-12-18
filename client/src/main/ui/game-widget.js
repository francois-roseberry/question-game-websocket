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
				players: showConnectedPlayers(widgetContainer),
				before: showStartButton(widgetContainer, task),
				starting: showStartingControls(widgetContainer, task),
				question: showQuestion(widgetContainer, task),
				waiting: showWaiting(widgetContainer),
				choosing: showChoices(widgetContainer, task),
				scores: showScores(widgetContainer)
			});
		});
	};
	
	function showPlayerLogin(container, task) {
		return function (error) {
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
				
			$(txtPlayerName[0]).keypress(function (e) {
				var chr = String.fromCharCode(e.which);
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
				.on('click', function () {
					var playerName = $(txtPlayerName[0]).val();
					task.setPlayerName(playerName);
				});
				
			$(txtPlayerName[0]).on('input', function () {
				var hasText = $(txtPlayerName[0]).val() !== "";
				if (hasText) {
					$(btnJoin[0]).removeAttr('disabled');
				} else {
					$(btnJoin[0]).attr('disabled', true);
				}
			});
				
			$(txtPlayerName[0]).on('keyup', function (e) {
				if (e.keyCode === 13) {
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
				.on('click', function () {
					task.setObserver();
				});
		};
	}
	
	function showConnectedPlayers(container) {
		return function (players) {
			if (players.length === 0) {
				container.append('span')
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
				.attr('data-player', function (player) {
					return player;
				})
				.text(function (player) {
					return player;
				});
		};
	}
	
	function showStartButton(container, task) {
		return function () {
			var btnStart = container.append('button')
				.classed({
					'btn': true,
					'btn-primary': true,
					'btn-lg': true,
					'btn-start-game': true
				})
				.text(i18n.START_GAME)
				.on('click', function () {
					task.startGame();
				});
				
			$(btnStart[0]).focus();
		};
	}
	
	function showStartingControls(container, task) {
		return function (secondsRemaining, isObserver) {
			container.append('p')
				.classed('game-starting', true)
				.text(i18n.STARTING_SOON.replace('{seconds}', secondsRemaining));
			
			if (!isObserver) {
				var btnCancel = container.append('button')
					.classed({
						'btn': true,
						'btn-primary': true,
						'btn-lg': true,
						'btn-cancel': true
					})
					.text(i18n.CANCEL)
					.on('click', function () {
						task.cancelStart();
					});
					
				$(btnCancel[0]).focus();
			}
		};
	}
	
	function showQuestion(container, task) {
		return function (question, questionIndex, questionCount, isObserver, error) {
			if (error) {
				container.append('div')
					.classed({
						'answer-error': true,
						'alert': true,
						'alert-danger': true
					})
					.text(i18n['ANSWER_ERROR_' + error]);
			}
			
			container.append('span')
				.classed({
					'badge': true,
					'question-number': true
				})
				.text(questionIndex + '/' + questionCount);
			
			container.append('p')
				.classed('question', true)
				.text(question);
				
			if (!isObserver) {
				var txtAnswer = container.append('div')
					.classed('form-group', true)
					.append('input')
					.attr({
						type: 'text',
						placeholder: i18n.ANSWER_CUE,
						maxlength: 25
					})
					.classed({
						'txt-answer': true,
						'form-control': true
					});
					
				$(txtAnswer[0]).keypress(function (e) {
					var chr = String.fromCharCode(e.which);
					if (FORBIDDEN_CHARS.indexOf(chr) > 0) {
						return false;
					}
				});
					
				var btnSubmit = container.append('button')
					.attr('disabled', true)
					.classed({
						'btn': true,
						'btn-primary': true,
						'btn-lg': true,
						'btn-submit-answer': true
					})
					.text(i18n.SUBMIT_ANSWER)
					.on('click', function () {
						var answer = $(txtAnswer[0]).val();
						task.submitAnswer(answer);
					});
					
				$(txtAnswer[0]).on('input', function () {
					var hasText = $(txtAnswer[0]).val() !== "";
					if (hasText) {
						$(btnSubmit[0]).removeAttr('disabled');
					} else {
						$(btnSubmit[0]).attr('disabled', true);
					}
				});
					
				$(txtAnswer[0]).on('keyup', function (e) {
					if (e.keyCode === 13) {
						$(btnSubmit[0]).click();
					}
				});
					
				$(txtAnswer[0]).focus();
			}
		};
	}
	
	function showWaiting(container) {
		return function () {
			container.append('p')
				.classed('waiting', true)
				.text(i18n.WAITING);
				
			container.append('div')
				.classed('loading-container', true)
				.append('p')
				.classed({
					'fa': true,
					'fa-spinner': true,
					'fa-spin': true,
					'loading': true
				});
		};
	}
	
	function showChoices(container, task) {
		return function (choices) {
			container
				.selectAll('.btn-choice')
				.data(choices)
				.enter()
				.append('button')
				.classed({
					'btn': true,
					'btn-primary': true,
					'btn-block': true,
					'btn-md': true,
					'btn-choice': true
				})
				.attr('data-index', function (choice, index) {
					return index;
				})
				.text(function (choice) {
					return choice;
				})
				.on('click', function (choice) {
					task.submitChoice(choice);
				});
		};
	}
	
	function showScores(container) {
		return function (scores) {
			var scoreElements = container.append('div')
				.classed('scores', true)
				.selectAll('.score')
				.data(scores)
				.enter()
				.append('div')
				.classed('score', true)
				.attr('data-player', function (score) {
					return score.name;
				});
				
			scoreElements.append('span')
				.classed({
					'score-name': true,
					'pull-left': true
				})
				.text(function (score) {
					return score.name;
				});
				
			scoreElements.append('span')
				.classed({
					'score-value': true,
					'pull-right': true
				})
				.text(function (score) {
					return score.score;
				});
		};
	}
}());
