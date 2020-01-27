import Controller, { inject as controller } from '@ember/controller';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';
import Message from 'hyperchannel/models/message';
import { computed } from '@ember/object';

export default Controller.extend({

  newMessage: null,
  application: controller(),
  space: controller(),
  coms: service(),
  router: service(),
  storage: service('remotestorage'),

  currentSpace: alias('space.model'),
  showChannelMenu: alias('application.showChannelMenu'),

  createMessage(message, type) {
    return Message.create({
      type: type,
      date: new Date(),
      nickname: this.get('currentSpace.server.nickname'),
      content: message
    });
  },

  sidebarClass: computed('router.currentRouteName', function(){
    const route = this.router.currentRouteName;
    const wideBars = ['shares', 'settings'].map(r => `space.channel.${r}`);
    return wideBars.includes(route) ? 'sidebar-wide' : 'sidebar-normal';
  }),

  actions: {

    menu (which, what) {
      // Do not toggle sidebav on desktop
      if (which.match(/(global|channel)/) && window.innerWidth > 900) return;

      let menuProp = `show${which.capitalize()}Menu`;

      switch(what) {
        case 'show':
          this.application.set(menuProp, true);
          break;
        case 'hide':
          this.application.set(menuProp, false);
          break;
        case 'toggle':
          this.application.toggleProperty(menuProp);
          break;
      }
    },

    sendMessage: function(newMessage) {
      let message = this.createMessage(newMessage, 'message-chat');

      this.coms.transferMessage(
        this.currentSpace,
        this.model,
        message.get('content')
      );

      this.model.addMessage(message);
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
        console.warn('[channel]', 'Unknown command', commandText);
      }

      this.set('newMessage', null);
    },

    joinCommand: function(args) {
      let space = this.currentSpace;
      let channel = this.coms.createChannel(space, args[0]);
      this.storage.saveSpace(space);
      this.transitionToRoute('space.channel', space, channel);
    },

    partCommand: function() {
      let space = this.currentSpace;
      let channelName = this.get('model.name');
      this.coms.removeChannel(space, channelName);
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

      this.coms.transferMeMessage(
        this.currentSpace,
        this.get('model.sockethubChannelId'),
        message.get('content')
      );

      this.model.addMessage(message);
    },

    msgCommand: function(args) {
      let username = args.shift();
      this.coms.createUserChannel(this.currentSpace, username);
      // TODO fix this, sockethub sends a failure event with error
      // "TypeError: Cannot read property 'indexOf' of undefined"
      // this.get('coms').transferMessage(this.get('currentSpace'), username, args.join(' '));
    },

    topicCommand: function(args) {
      let channel = this.model;
      let topic = args.join(' ');

      this.coms.changeTopic(this.currentSpace, channel, topic);
    }

  }

});
