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

    processMessageOrCommand: function() {
      if(this.controller.get('newMessage').substr(0, 1) === "/") {
        this.send('executeCommand')
      } else {
        this.send('sendMessage');
      }
    },

    sendMessage: function() {
      var space = this.modelFor('space');

      var message = Message.create({
        date: new Date(),
        nickname: space.get('ircServer.nickname'),
        content: this.controller.get('newMessage')
      });

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

      this.controller.get('model.messages').pushObject(message);
      this.controller.set('newMessage', null);
    },

    executeCommand: function() {
      var availableCommands = [
        "help",
        "join",
        "part"
      ];
      var commandText = this.controller.get('newMessage').substr(1)
      var commandSplitted = commandText.split(" ");
      var command = commandSplitted[0];

      if(availableCommands.contains(command)) {
        this.send(command + 'Command', commandSplitted.slice(1))
      } else {
        console.log('error, unknown', commandText)
      }

      this.controller.set('newMessage', null);
    },

    joinCommand: function(args) {
      var space = this.modelFor('space');
      var channel = this.smt.createChannel(space, args[0]);
      this.transitionTo('space.channel', space, channel);
    },

    partCommand: function(args) {

    },

    helpCommand: function(args) {

    }

  }

});
