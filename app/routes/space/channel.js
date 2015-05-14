import Ember from 'ember';
import Message from 'hyperchannel/models/message';

export default Ember.Route.extend({

  model: function(params) {
    return this.modelFor('space')
               .get('channels')
               .findBy('slug', params.slug);
  },

  actions: {

    sendMessage: function() {
      var message = Message.create({
        date: new Date(),
        nickname: 'raucao',
        content: this.controller.get('newMessage')
      });

      this.controller.get('model.messages').pushObject(message);
      this.controller.set('newMessage', '');
    }

  }

});
