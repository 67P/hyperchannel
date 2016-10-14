import Ember from 'ember';
import Message from 'hyperchannel/models/message';

export default Ember.Route.extend({

  model: function(params) {
    var space = this.modelFor('space');
    var channel = space.get('channels').findBy('slug', params.slug);
    if (!channel) {
      channel = this.createChannelOrUserChannel(space, params.slug);
    }
    return channel;
  },

  setupController: function(controller, model) {
    this._super(controller, model);

    Ember.run.scheduleOnce('afterRender', function() {
      Ember.$('input#message-field').focus();
      Ember.$('#channel-content').animate({
        scrollTop: Ember.$('#channel-content ul').height()
      }, '500');
    });
  },

  actions: {

    sendMessage: function(newMessage) {
      var space = this.modelFor('space');

      var message = Message.create({
        type: 'message-chat',
        date: new Date(),
        nickname: space.get('ircServer.nickname'),
        content: newMessage
      });

      this.send('transferMessage',
         this.controller.get('model.sockethubChannelId'),
         message.get('content')
      );

      this.controller.get('model.messages').pushObject(message);
      this.controller.set('newMessage', null);
    },

    transferMessage: function(target, content) {
      var space = this.modelFor('space');

      var job = {
        context: 'irc',
        '@type': 'send',
        actor: space.get('sockethubPersonId'),
        target: target,
        object: {
          '@type': 'message',
          content: content
        }
      };

      console.log('sending message job', job);
      this.sockethub.socket.emit('message', job);
    },

    executeCommand: function(newMessage) {
      var availableCommands = [
        "help",
        "join",
        "leave",
        "msg",
        "part",
        "topic"
      ];
      var commandText = newMessage.substr(1);
      var commandSplitted = commandText.split(" ");
      var command = commandSplitted[0];

      if (availableCommands.includes(command.toLowerCase())) {
        this.send(command + 'Command', commandSplitted.slice(1));
      } else {
        console.log('Unknown command', commandText);
      }

      this.controller.set('newMessage', null);
    },

    joinCommand: function(args) {
      var space = this.modelFor('space');
      var channel = this.smt.createChannel(space, args[0]);
      this.transitionTo('space.channel', space, channel);
    },

    partCommand: function() {
      var space = this.modelFor('space');
      var channelName = this.controller.get('model.name');
      this.smt.removeChannel(space, channelName);
      var lastChannel = space.get('channels.lastObject');
      this.transitionTo('space.channel', space, lastChannel);
    },

    leaveCommand: function() {
      this.send('partCommand');
    },

    helpCommand: function() {

    },

    msgCommand: function(args) {
      var space = this.modelFor('space');
      this.smt.createUserChannel(space, args[0]);
      // this.send('transferMessage', args[0], args[1]);
    },

    topicCommand: function(args) {
      var space = this.modelFor('space');
      var channel = this.controller.get('model');
      var topic = args.join(' ');

      this.smt.changeTopic(space, channel, topic);
    }
  }

});
