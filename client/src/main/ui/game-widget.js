const precondition = require('./contract').precondition;

const PlayerLoginWidget = require('./player-login-widget');
const PlayerListWidget = require('./player-list-widget');
const StartWidget = require('./start-widget');
const StartingWidget = require('./starting-widget');
const QuestionWidget = require('./question-widget');
const WaitingWidget = require('./waiting-widget');
const ChoiceWidget = require('./choice-widget');
const ResultWidget = require('./result-widget');
const ScoreWidget = require('./score-widget');
const QuitWidget = require('./quit-widget');

exports.render = (container, task) => {
	precondition(container, 'Game widget requires a container');
	precondition(task, 'Game widget requires a game task');

	const widgetContainer = d3.select(container[0]).append('div');

	task.status().subscribe(status => {
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

const showPlayerLogin = (container, task) => error => {
	PlayerLoginWidget.render(container, task, error);
};

const showConnectedPlayers = container => players => {
	PlayerListWidget.render(container, players);
};

const showStartButton = (container, task) => () => {
	StartWidget.render(container, task);
};

const showStartingControls = (container, task) => (secondsRemaining, isObserver) => {
	StartingWidget.render(container, task, secondsRemaining, isObserver);
};

const showQuestion = (container, task) => (question, questionIndex, questionCount, answerState, isObserver, error) => {
	QuestionWidget.render(container, task, question, questionIndex, questionCount, answerState, isObserver, error);
};

const showWaiting = container => () => {
	WaitingWidget.render(container);
};

const showChoices = (container, task) => (choices, choiceState, isObserver) => {
	ChoiceWidget.render(container, task, choices, choiceState, isObserver);
};

const showResults = container => result => {
	ResultWidget.render(container, result);
};

const showScores = container => (scores, isFinal) => {
	ScoreWidget.render(container, scores, isFinal);
};

const showQuitMessage = container => playerName => {
	QuitWidget.render(container, playerName);
};
