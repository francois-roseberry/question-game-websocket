var i18n = require('./i18n').i18n();
var precondition = require('./contract').precondition;

exports.render = (container) => {
  precondition(container, 'Waiting widget requires a container');

  container.append('p')
    .classed('waiting', true)
    .text(i18n.WAITING);

  container.append('div')
    .classed('loading-container', true)
    .append('p')
    .classed({
      'fa': true,
      'fa-spinner': true,
      'fa-spin': true,
      'loading': true
    });
}
