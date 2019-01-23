# The bluff & lie game

[![CircleCI](https://circleci.com/gh/francois-roseberry/question-game-websocket.svg?style=shield&circle-token=127f68bf0984493ffae0e9b1a80da8438d75d47c)](https://circleci.com/gh/francois-roseberry/question-game-websocket)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.svg)](https://gruntjs.com/)

A bluffing game inspired by Fibbage

Original use case : I wanted to play Fibbage at a family party but a portion is unilingual francophone. Since I did want to include everyone, and Fibbage does not allow providing your own questions, I created this game with basically the same workflow (albeit simplified and visually ugly). So I welcome any web designer's help !

Game server runs by using the run.sh provided

The questions (and their answers) are stored in a json file which you pass at start :  
``node server/server.js -w client/target -q questionfile.json``  
See the example files [questions.json](./questions.json) for the format, pretty straightforward

Connect clients at the address and port of the server. Those users now have the choice to be observers, or players. Observers will have a read-only screen showing server state, what happens in the game (like, who is connected, results, score, etc.) and read questions aloud (using Speech Synthesis API instead of professional actors like Fibbage). Players can play the game (duh! - answer questions, pick choices, etc.) Observers are best displayed on large screens (desktops, TVs), while players are best displayed on mobile (Android, Iphone)

For those who know Fibbage, the pattern here is the same except there can be many observers instead of just one.

## Setup

Nodejs will need to be installed

Grunt and Bower will need to be installed globally ``npm install -g grunt && npm install -g bower``

Other dependencies will need to be installed. For this go in the server directory and do ``npm install``, then go in the client directory and do ``npm install && bower install``

In that same directory, it should now be possible to do ``npm run package``to build the client. Do ``npm run background``to launch the development server. This last command is blocking. In another terminal, do ``npm run check``to run the client tests.

In the server directory, run the server tests with ``npm test``. Don't forget to start the server first (a running server is required for acceptance tests).

For more info, you can check [circle.yml](./circle.yml) - CircleCI's configuration file - to see exactly how the project is built from scratch
