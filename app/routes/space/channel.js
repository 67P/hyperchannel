import Ember from 'ember';
import Message from 'hyperchannel/models/message';

export default Ember.Route.extend({

  model: function(params) {
    return this.modelFor('space')
               .get('channels')
               .findBy('slug', params.slug);
  },

  setupController: function(controller, model) {
    this._super(controller, model);

    Ember.run.scheduleOnce('afterRender', function() {
      Ember.$('input#message-field').focus();
    });
  },

  actions: {

    sendMessage: function() {
      var space = this.modelFor('space');

      var message = Message.create({
        date: new Date(),
        nickname: space.get('ircServer.nickname'),
        content: this.controller.get('newMessage')
      });

      this.controller.get('model.messages').pushObject(message);
      this.controller.set('newMessage', '');

      var job = {
        context: 'irc',
        '@type': 'send',
        actor: space.get('sockethubPersonId'),
        target: this.controller.get('model.sockethubChannelId'),
        object: {
          '@type': 'message',
          content: message.get('content')
        }
      };

      console.log('sending message job', job);
      this.sockethub.socket.emit('message', job);
    }

  }

});
