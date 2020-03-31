import Controller, { inject as controller } from '@ember/controller';
import { action, computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';
import { tracked } from '@glimmer/tracking';
import Message from 'hyperchannel/models/message';

export default class BaseChannelController extends Controller {

  @tracked newMessage = null;
  @controller application;
  @controller space;
  @service coms;
  @service router;
  @service('remotestorage') storage;

  @alias('space.model') currentSpace;
  @alias('application.showChannelMenu') showChannelMenu;

  createMessage (message, type) {
    return new Message({
      type: type,
      date: new Date(),
      nickname: this.currentSpace.server.nickname,
      content: message
    });
  }

  @computed('router.currentRouteName')
  get sidebarClass () {
    const route = this.router.currentRouteName;
    const wideBars = ['shares', 'settings'].map(r => `space.channel.${r}`);
    return wideBars.includes(route) ? 'sidebar-wide' : 'sidebar-normal';
  }

  @action
  menu (which, what) {
    // Do not toggle sidebav on desktop
    if (which.match(/(global|channel)/) && window.innerWidth > 900) return;

    let menuProp = `show${which.capitalize()}Menu`;

    switch(what) {
      case 'show':
        this.application.menuProp = true;
        break;
      case 'hide':
        this.application.menuProp = false;
        break;
      case 'toggle':
        this.application.toggleProperty(menuProp);
        break;
    }
  }

  @action
  sendMessage (newMessage) {
    let message = this.createMessage(newMessage, 'message-chat');

    this.coms.transferMessage(
      this.currentSpace,
      this.model,
      message.content
    );

    this.model.addMessage(message);
    this.newMessage = null;
  }

  @action
  executeCommand (newMessage) {
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

    this.newMessage = null;
  }

  @action
  joinCommand (args) {
    let space = this.currentSpace;
    let channel = this.coms.createChannel(space, args[0]);
    this.storage.saveSpace(space);
    this.transitionToRoute('space.channel', space, channel);
  }

  @action
  partCommand () {
    let space = this.currentSpace;
    let channelName = this.model.name;
    this.coms.removeChannel(space, channelName);
    let lastChannel = space.channels.lastObject;
    if (isPresent(lastChannel)) {
      this.transitionToRoute('space.channel', space, lastChannel);
    } else {
      this.transitionToRoute('space', space);
    }
  }

  @action
  leaveCommand () {
    this.send('partCommand');
  }

  @action
  helpCommand () {
  }

  @action
  meCommand (args) {
    let newMessage = args.join(' ');

    let message = this.createMessage(newMessage, 'message-chat-me');

    this.coms.transferMeMessage(
      this.currentSpace,
      this.model.sockethubChannelId,
      message.content
    );

    this.model.addMessage(message);
  }

  @action
  msgCommand (args) {
    let username = args.shift();
    this.coms.createUserChannel(this.currentSpace, username);
    // TODO fix this, sockethub sends a failure event with error
    // "TypeError: Cannot read property 'indexOf' of undefined"
    // this.coms.transferMessage(this.currentSpace, username, args.join(' '));
  }

  @action
  topicCommand (args) {
    let channel = this.model;
    let topic = args.join(' ');

    this.coms.changeTopic(this.currentSpace, channel, topic);
  }

}
