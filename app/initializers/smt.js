import smt from 'hyperchannel/services/smt';

export default {
  name: 'smt',
  initialize: function initialize(container, app) {
    container.register('service:smt', smt);

    app.inject('route', 'smt', 'service:smt');
    app.inject('controller', 'smt', 'service:smt');
  }
};
