# Trump yourself

A bluffing game inspired by Fibbage

Game server runs by using the run.sh provided

The questions (and their answers) are stored in a json file which you pass at start :  
``node server/server.js -w client/target -q questionfile.json``  
See the example files [questions.json](./questions.json) for the format, pretty straightforward

Connect clients at the address and port of the server. Those users now have the choice to be observers, or players. Observers will have a read-only screen showing server state and will know what happens in the game (like, who is connected, results, score, etc.). Players can play the game (duh! - answer questions, etc.) Observers are best displayed on large screens (desktops, TVs), while players are best displayed on mobile (Android, Iphone)
