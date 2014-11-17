import Ember from 'ember';

export default Ember.Route.extend({

  setupController: function() {
    var self = this;

    this.sockethub.on('registered', function() {
      self.sockethub.set('irc', 'hyperchannel', {
        objectType: 'credentials',
        nick: 'hyperchannelyoyoyo',
        server: 'irc.freenode.net',
        channel: '#prague'
      }).then(function () {
        console.log('successfully set credentials for irc');

        // self.sockethub.on('irc', 'message', function(m) {
        //   console.log('irc message received: ', m);
        // });

        self.sockethub.sendObject({
          platform: 'irc',
          verb: 'join',
          actor: { address: 'hyperchannel' },
          object: {},
          target: [{address: '#prague'}]
        }).then(function() {
          console.log('joined channel');
          self.sockethub.sendObject({
            platform: 'irc',
            verb: 'send',
            actor: { address: 'hyperchannel' },
            object: { text: 'Hello from Hyperchnnel' },
            target: [{address: '#prague'}]
          }).then(function() {
            console.log('sent message');
          }, function(err) {
            console.log('error sending message', err);
          });
        }, function(err) {
          console.log('error joining channel', err);
        });

      }, function (err) {
        console.log('error setting credentials for irc :( ', err);
      });
    });
  }

});
