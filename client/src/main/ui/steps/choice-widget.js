var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

exports.render = (container, task, choices, choiceState, isObserver) => {
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
    .attr('data-index', (choice, index) => index)
    .text(choice => choice)
    .on('click', choice => {
      task.submitChoice(choice);
    });

  if (isObserver) {
    const tokenContainer = container
      .append('div')
      .classed('choice-tokens-wrapper', true)
      .append('div')
      .classed('choice-tokens', true);

    choiceState.subscribe(({count, total}) => {
      tokenContainer.selectAll('*').remove();

      tokenContainer
        .selectAll('.choice-token')
        .data(_.range(total))
        .enter()
        .append('span')
        .classed({
          'choice-token': true,
          'off': index => index >= count,
          'on': index => index < count,
          'glyphicon': true,
          'glyphicon-remove-sign': index => index >= count,
          'glyphicon-ok-sign': index => index < count
        });
    });
  }
}
