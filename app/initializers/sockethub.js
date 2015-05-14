/* global SockethubClient */
/* global io */

// TODO move settings into config file
var sockethub = new SockethubClient(io('localhost:10550', { path: '/sockethub' }));

export default {
  name: 'sockethub',

  initialize: function(container) {
    container.register('sockethub:client', sockethub, {instantiate: false, singleton: true});

    container.injection('controller', 'sockethub', 'sockethub:client');
    container.injection('route',      'sockethub', 'sockethub:client');
    container.injection('component',  'sockethub', 'sockethub:client');
    container.injection('service',    'sockethub', 'sockethub:client');
  }
};

