import smt from 'hyperchannel/services/smt';

export default {
  name: 'smt',
  initialize: function initialize(app) {
    app.register('service:smt', smt);

    app.inject('route', 'smt', 'service:smt');
    app.inject('controller', 'smt', 'service:smt');
  }
};

