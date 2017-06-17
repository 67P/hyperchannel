import Ember from 'ember';
import Message from 'hyperchannel/models/message';

const {
  Controller,
  inject: {
    controller,
    service
  },
  Logger,
  isPresent
} = Ember;

export default Controller.extend({

  newMessage: null,
  space: controller(),
  coms: service(),
  storage: service('remotestorage'),

  createMessage(message, type) {
    return Message.create({
      type: type,
      date: new Date(),
      nickname: this.get('space.model.server.nickname'),
      content: message
    });
  },

  actions: {
    sendMessage: function(newMessage) {
      let message = this.createMessage(newMessage, 'message-chat');

      this.get('coms').transferMessage(
        this.get('space.model'),
        this.get('model'),
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
        Logger.warn('[channel]', 'Unknown command', commandText);
      }

      this.set('newMessage', null);
    },

    joinCommand: function(args) {
      let space = this.get('space.model');
      let channel = this.get('coms').createChannel(space, args[0]);
      this.get('storage').saveSpace(space);
      this.transitionToRoute('space.channel', space, channel);
    },

    partCommand: function() {
      let space = this.get('space.model');
      let channelName = this.get('model.name');
      this.get('coms').removeChannel(space, channelName);
      let lastChannel = space.get('channels.lastObject');
      if (isPresent(lastChannel)) {
        this.transitionToRoute('space.channel', space, lastChannel);
      } else {
        this.transitionToRoute('space', space);
      }
    },

    leaveCommand: function() {
      this.send('partCommand');
    },

    helpCommand: function() {
    },

    meCommand: function(args) {
      let newMessage = args.join(' ');

      let message = this.createMessage(newMessage, 'message-chat-me');

      this.get('coms').transferMeMessage(
        this.get('space.model'),
        this.get('model.sockethubChannelId'),
        message.get('content')
      );

      this.get('model.messages').pushObject(message);
    },

    msgCommand: function(args) {
      let username = args.shift();
      this.get('coms').createUserChannel(this.get('space.model'), username);
      // TODO fix this, sockethub sends a failure event with error
      // "TypeError: Cannot read property 'indexOf' of undefined"
      // this.get('coms').transferMessage(this.get('space.model'), username, args.join(' '));
    },

    topicCommand: function(args) {
      let channel = this.get('model');
      let topic = args.join(' ');

      this.get('coms').changeTopic(this.get('space.model'), channel, topic);
    }
  }

});
