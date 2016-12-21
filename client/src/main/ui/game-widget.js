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
				results: showResults(widgetContainer),
				scores: showScores(widgetContainer),
				quit: showQuitMessage(widgetContainer)
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
					'question-number': true,
					'observer': isObserver
				})
				.text(questionIndex + '/' + questionCount);
			
			container.append('p')
				.classed({
					'question': true,
					'observer': isObserver
				})
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
			
			if (isObserver && ('speechSynthesis' in window)) {
				var msg = new SpeechSynthesisUtterance(question);
				msg.rate = 0.8;
				window.speechSynthesis.speak(msg);
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
		return function (choices, isObserver) {
			container
				.selectAll('.btn-choice')
				.data(choices)
				.enter()
				.append(isObserver ? 'div' : 'button')
				.classed({
					'btn': !isObserver,
					'btn-primary': !isObserver,
					'btn-block': !isObserver,
					'btn-md': !isObserver,
					'btn-choice': true,
					'observer': isObserver,
					'col-md-4': isObserver,
					'col-centered': isObserver
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
	
	function showResults(container) {
		return function (result) {
			container.append('div')
				.classed('result-choice', true)
				.text(i18n.RESULT_CHOICE.replace('{choice}', result.choice));
				
			container.append('ul')
				.classed('result-authors', true)
				.selectAll('.result-author')
				.data(result.authors)
				.enter()
				.append('li')
				.classed({
					'result-author': true,
					'result-truth': function (author) {
						return author === 'TRUTH';
					},
					'result-lie': function (author) {
						return author !== 'TRUTH';
					}
				})
				.attr('data-author', function (author) {
					return author;
				})
				.text(function (author) {
					if (author === 'TRUTH') {
						return i18n.RESULT_CHOICE_TRUTH;
					}
					
					return i18n.RESULT_CHOICE_LIE
						.replace('{author}', author);
				});
				
			container.append('div')
				.classed('result-choosers', true)
				.selectAll('.result-chooser')
				.data(result.choosedBy)
				.enter()
				.append('div')
				.classed('result-chooser', true)
				.attr('data-chooser', function (chooser) {
					return chooser;
				})
				.text(function (chooser) {
					return i18n.RESULT_CHOOSED_BY
						.replace('{chooser}', chooser);
				});
		};
	}
	
	function showScores(container) {
		return function (scores, isFinal) {
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
	
	function showQuitMessage(container) {
		return function (playerName) {
			container.append('p')
				.classed('player-quit', true)
				.text(i18n.PLAYER_QUIT.replace('{player}', playerName));
		};
	}
}());
