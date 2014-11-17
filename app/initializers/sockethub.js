/* global SockethubClient */

// TODO move settings into config file
var sockethubClient = SockethubClient.connect({
  host: 'localhost',
  register: {
    secret: '1234567890'
  }
});

export default {
  name: 'sockethub',

  initialize: function(container) {
    container.register('sockethub:client', sockethubClient, {instantiate: false, singleton: true});

    container.injection('controller', 'sockethub', 'sockethub:client');
    container.injection('route',      'sockethub', 'sockethub:client');
    container.injection('component',  'sockethub', 'sockethub:client');
  }
};

