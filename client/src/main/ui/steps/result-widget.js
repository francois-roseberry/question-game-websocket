var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

exports.render = (container, result) => {
  precondition(container, 'Result widget requires a container');
	precondition(result, 'Result widget requires a result');

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
      'result-truth': author => author === 'TRUTH',
      'result-lie': author => author !== 'TRUTH'
    })
    .attr('data-author', author => author)
    .text(author => {
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
    .attr('data-chooser', chooser => chooser)
    .text(chooser => i18n.RESULT_CHOOSED_BY
        .replace('{chooser}', chooser));
}
