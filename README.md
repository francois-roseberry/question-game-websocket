# Trump yourself

A bluffing game inspired by Fibbage

Game server runs by using the run.sh provided

The questions (and their answers) are stored in a json file which you pass at start :  
``node server/server.js -w client/target -q questionfile.json``  
See the example files [questions.json](./questions.json) for the format, pretty straightforward

Connect clients at the address and port of the server. Those users now have the choice to be observers, or players. Observers will have a read-only screen showing server state and will know what happens in the game (like, who is connected, results, score, etc.). Players can play the game (duh! - answer questions, etc.) Observers are best displayed on large screens (desktops, TVs), while players are best displayed on mobile (Android, Iphone)

## Setup

Nodejs will need to be installed

Grunt and Bower will need to be installed globally ``npm install -g grunt && npm install -g bower``

Other dependencies will need to be installed. For this go in the server directory and do ``npm install``, then go in the client directory and do ``npm install && bower install``

In that same directory, it should now be possible to do ``grunt package``to build the client. Do ``grunt background``to launch the development server. In another terminal, do ``grunt check``to run the client tests.

In the server directory, run the server tests with ``npm test`
