/* global SockethubClient */
/* global io */

// TODO move settings into config file
var sockethub = new SockethubClient(io('localhost:10550', { path: '/sockethub' }));

export default {
  name: 'sockethub',

  initialize: function(app) {
    app.register('sockethub:client', sockethub, {instantiate: false, singleton: true});

    app.inject('controller', 'sockethub', 'sockethub:client');
    app.inject('route',      'sockethub', 'sockethub:client');
    app.inject('component',  'sockethub', 'sockethub:client');
    app.inject('service',    'sockethub', 'sockethub:client');
  }
};

