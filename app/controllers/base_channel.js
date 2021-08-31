import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';
import { tracked } from '@glimmer/tracking';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';

export default class BaseChannelController extends Controller {

  @tracked newMessage = null;
  @controller application;
  @service coms;
  @service router;
  @service('remotestorage') storage;

  get showChannelMenu () {
    return this.application.showChannelMenu;
  }

  createMessage (content, type) {
    const message = new Message({
      type: type,
      date: new Date(),
      // TODO  nickname per channel
      nickname: this.model.account.nickname,
      content: content
    });

    // We only receive our own message from XMPP MUCs (but not DMs)
    // TODO implement message carbons or another way of verifying sent status
    if (this.model.protocol === 'XMPP' &&
       (this.model instanceof Channel)) {
      message.pending = true;
    }

    return message;
  }

  get sidebarClass () {
    const route = this.router.currentRouteName;
    const wideBars = ['shares', 'settings'].map(r => `channel.${r}`);
    return wideBars.includes(route) ? 'sidebar-wide' : 'sidebar-normal';
  }

  @action
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
  }

  @action
  sendMessage (newMessage) {
    const message = this.createMessage(newMessage, 'message-chat');

    this.coms.transferMessage(this.model, message.content);

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
    const channel = this.coms.createChannel(this.model.account, args[0]);
    // TODO this.storage.saveChannel(channel);
    this.transitionToRoute('channel', channel);
  }

  @action
  partCommand () {
    this.coms.removeChannel(this.model);
    const lastChannel = this.coms.channels.lastObject;
    if (isPresent(lastChannel)) {
      this.transitionToRoute('channel', lastChannel);
    } else {
      // TODO handle zero channels left
      console.warn('No channels left to transition to');
      this.transitionToRoute('index');
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
      this.model.account,
      this.model.sockethubChannelId,
      message.content
    );

    this.model.addMessage(message);
  }

  @action
  msgCommand (args) {
    let username = args.shift();
    this.coms.createUserChannel(this.model.account, username);
    // TODO fix this, sockethub sends a failure event with error
    // "TypeError: Cannot read property 'indexOf' of undefined"
    // this.coms.transferMessage(username, args.join(' '));
  }

  @action
  topicCommand (args) {
    let channel = this.model;
    let topic = args.join(' ');

    this.coms.changeTopic(channel, topic);
  }

  @action
  addUsernameMentionToMessage (username) {
    const msg = this.newMessage || '';
    if (!msg.match(new RegExp(`^${username}`))) {
      this.newMessage = `${username}: ${msg}`;
    }
  }

}
