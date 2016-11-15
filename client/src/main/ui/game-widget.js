(function() {
	"use strict";
	
	exports.render = function (container, task) {
		d3.select(container[0])
			.append('span')
			.text('Hello World!');
	};
}());