(function() {
	"use strict";
	
	var i18n = require('./i18n').i18n();
	var precondition = require('./contract').precondition;
	
	exports.render = function (container, task) {
		precondition(container, 'Game widget requires a container');
		precondition(task, 'Game widget requires a game task');
		
		var widgetContainer = d3.select(container[0]).append('div');
		
		widgetContainer.append('input')
			.attr({
				type: 'text',
				placeholder: i18n.PLAYER_NAME_CUE
			})
			.classed('txt-player-name', true);
			
		widgetContainer.append('button')
			.classed('btn-join-game', true)
			.text(i18n.JOIN_GAME);
	};
}());