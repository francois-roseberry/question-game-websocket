var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

var FORBIDDEN_CHARS = "!@£/\"\\$%?¢¤¬&*²¦²³";

exports.render = (container, task, question, questionIndex, questionCount, answerState, isObserver, error) => {
  precondition(container, 'Question widget requires a container');
	precondition(task, 'Question widget requires a game task');

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

  if (isObserver) {
    const tokenContainer = container
      .append('div')
      .classed('answer-tokens-wrapper', true)
      .append('div')
      .classed('answer-tokens', true);

    answerState.subscribe(({count, total}) => {
      tokenContainer.selectAll('*').remove();

      tokenContainer
        .selectAll('.answer-token')
        .data(_.range(total))
        .enter()
        .append('span')
        .classed({
          'answer-token': true,
          'off': index => index >= count,
          'on': index => index < count,
          'glyphicon': true,
          'glyphicon-remove-sign': index => index >= count,
          'glyphicon-ok-sign': index => index < count
        });
    });
  }

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

    $(txtAnswer[0]).keypress(({ which }) => {
      var chr = String.fromCharCode(which);
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
      .on('click', () => {
        var answer = $(txtAnswer[0]).val();
        task.submitAnswer(answer);
      });

    $(txtAnswer[0]).on('input', () => {
      var hasText = $(txtAnswer[0]).val() !== "";
      if (hasText) {
        $(btnSubmit[0]).removeAttr('disabled');
      } else {
        $(btnSubmit[0]).attr('disabled', true);
      }
    });

    $(txtAnswer[0]).on('keyup', ({ keyCode }) => {
      if (keyCode === 13) {
        $(btnSubmit[0]).click();
      }
    });

    $(txtAnswer[0]).focus();
  }

  if (isObserver && ('speechSynthesis' in window)) {
    var msg = new SpeechSynthesisUtterance(question);
    msg.rate = 1;
    window.speechSynthesis.speak(msg);
  }
}
