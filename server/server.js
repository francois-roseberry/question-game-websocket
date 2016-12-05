var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var program = require('commander');

var port = 3000;

program
	.version('0.1')
	.option('-w, --webclient <directory>', 'The directory served')
	.parse(process.argv);

app.use(express.static(program.webclient));

io.on('connection', function(socket) {
	var address = socket.handshake.address;
	console.log('A user connected from ' + address.address + ':' + address.port);
	socket.on('name', function (name) {
		console.log('A user identified as [' + name + "]");
	});
	socket.on('disconnect', function() {
		console.log('user disconnected');
	});
});

http.listen(port, function () {
	console.log('Question game server listening on port ' + port);
});