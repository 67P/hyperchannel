/* global Hammer */
import Component from '@glimmer/component';
import { later, scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { action } from '@ember/object';

function scrollToBottom () {
  let elem = document.getElementById('channel-content');
  elem.scrollTop = elem.scrollHeight;
}

export default class ChannelContainerComponent extends Component {

  @service router;
  @service coms;

  @tracked automaticScrollingEnabled = true;
  @tracked partialRenderingEnabled = true;

  @tracked partialRenderingObserverMargin = '200px';

  @tracked renderedMessagesCount = 0; // maximum number of messages to render
  renderedMessagesAddendumAmount = 30; // number of messages to increase rendering count by

  get renderedMessages () {
    if (this.partialRenderingEnabled) {
      return this.args.channel.sortedMessages.slice(-this.renderedMessagesCount);
    } else {
      return this.args.channel.sortedMessages;
    }
  }

  @action
  channelChanged () {
    this.renderedMessagesCount = this.renderedMessagesAddendumAmount;
    this.partialRenderingEnabled = true;
    this.automaticScrollingEnabled = true;
    later(this, () => this.menu('global', 'hide'), 500);
  }

  @action
  messagesUpdated () {
    if (this.automaticScrollingEnabled) {
      scheduleOnce('afterRender', scrollToBottom);
    }
  }

  @action
  scheduleOnAfterRender () {
    scheduleOnce('afterRender', this, this.onAfterRender);
  }

  onAfterRender () {
    // TODO update the config when window is resized
    const element = document.getElementById('channel');
    this.partialRenderingObserverMargin = `${element.clientHeight/3}px`;

    // We need to define an empty handler for swipe events on the
    // #channel-content element, so that the actual handler of the app container
    // component gets triggered
    Hammer(document.getElementById('channel-content')).on('swipe', function(){});
  }

  focusMessageInputField () {
    const inputEl = document.querySelector('input#message-field');
    inputEl.focus();
  }

  @(task(function * () {
    this.automaticScrollingEnabled = false;
    yield this.coms.loadArchiveMessages(
      this.args.channel,
      this.args.channel.searchedPreviousLogsUntilDate,
      { minMessages: 1, maxDays: 1 }
    );
  }).drop()) loadPreviousMessages;

  // TODO make dynamic based on active sidebar content
  get headerNavButtonUsersActive () {
    if (window.innerWidth > 900) return true;
    return this.args.showChannelMenu;
  }

  @action
  processMessageOrCommand (e) {
    if (e && e.preventDefault) e.preventDefault();
    const msg = document.querySelector('input#message-field').value;

    if (msg.substr(0, 1) === "/") {
      this.args.onCommand(msg);
    } else {
      this.args.onMessage(msg);
    }
  }

  @action
  menu (which, what) {
    this.args.onMenu(which, what);
  }

  @action
  addUsernameMentionToMessage (username) {
    this.args.addUsernameMentionToMessage(username);
    this.focusMessageInputField();
  }

  @action
  increaseRenderedMessagesCount () {
    let newMessagesCount = this.renderedMessagesCount + this.renderedMessagesAddendumAmount;
    this.renderedMessagesCount =newMessagesCount;
    this.partialRenderingEnabled = newMessagesCount < this.args.channel.sortedMessages.length;
  }

  @action
  setAutomaticScrolling (state) {
    this.automaticScrollingEnabled = state;
  }

  @action
  leaveChannel (channel) {
    this.args.onLeaveChannel(channel);
  }

}
