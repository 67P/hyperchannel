import BaseChannel from 'hyperchannel/controllers/space/base_channel';

export default BaseChannel.extend({

  actions: {
    sendMessage: function(newMessage) {
      let message = this.createMessage(newMessage, 'message-chat');

      this.get('coms').transferMessage(
        this.get('space.model'),
        {
          '@id': this.get('model.sockethubChannelId'),
          '@type': 'person'
        },
        message.get('content')
      );

      this.get('model.messages').pushObject(message);
      this.set('newMessage', null);
    }
  }

});
