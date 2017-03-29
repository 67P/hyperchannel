import Ember from 'ember';
import Message from 'hyperchannel/models/message';

export default Ember.Controller.extend({

  newMessage: null,
  space: Ember.inject.controller(),
  smt: Ember.inject.service(),
  storage: Ember.inject.service('remotestorage'),

  actions: {
    sendMessage: function(newMessage) {
      let message = Message.create({
        type: 'message-chat',
        date: new Date(),
        nickname: this.get('space.model.server.nickname'),
        content: newMessage
      });

      this.get('smt').transferMessage(
        this.get('space.model'),
        this.get('model.sockethubChannelId'),
        message.get('content')
      );

      this.get('model.messages').pushObject(message);
      this.set('newMessage', null);
    },

    executeCommand: function(newMessage) {
      const availableCommands = [
        "help",
        "join",
        "leave",
        "me",
        "msg",
        "part",
        "topic"
      ];
      let commandText = newMessage.substr(1);
      let commandSplitted = commandText.split(" ");
      let command = commandSplitted[0];

      if (availableCommands.includes(command.toLowerCase())) {
        this.send(command + 'Command', commandSplitted.slice(1));
      } else {
        Ember.Logger.warn('[channel]', 'Unknown command', commandText);
      }

      this.set('newMessage', null);
    },

    joinCommand: function(args) {
      let space = this.get('space.model');
      let channel = this.get('smt').createChannel(space, args[0]);
      this.get('storage').saveSpace(space);
      this.transitionToRoute('space.channel', space, channel);
    },

    partCommand: function() {
      let space = this.get('space.model');
      let channelName = this.get('model.name');
      this.get('smt').removeChannel(space, channelName);
      let lastChannel = space.get('channels.lastObject');
      this.transitionToRoute('space.channel', space, lastChannel);
    },

    leaveCommand: function() {
      this.send('partCommand');
    },

    helpCommand: function() {
    },

    meCommand: function(args) {
      let newMessage = args.join(' ');

      let message = Message.create({
        type: 'message-chat-me',
        date: new Date(),
        nickname: this.get('space.model.server.nickname'),
        content: newMessage
      });

      this.get('smt').transferMeMessage(
        this.get('space.model'),
        this.get('model.sockethubChannelId'),
        message.get('content')
      );

      this.get('model.messages').pushObject(message);
    },

    msgCommand: function(args) {
      let username = args.shift();
      this.get('smt').createUserChannel(this.get('space.model'), username);
      // TODO fix this, sockethub sends a failure event with error
      // "TypeError: Cannot read property 'indexOf' of undefined"
      // this.get('smt').transferMessage(this.get('space.model'), username, args.join(' '));
    },

    topicCommand: function(args) {
      let channel = this.get('model');
      let topic = args.join(' ');

      this.get('smt').changeTopic(this.get('space.model'), channel, topic);
    }
  }

});
