import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked, cached } from '@glimmer/tracking';
import Hammer from 'hammerjs';
import { action } from '@ember/object';

const INITIAL_RENDERED_MESSAGES = 50;
const RENDERED_MESSAGES_INCREMENT = 50;

export default class ChannelContainerComponent extends Component {

  @service router;
  @service coms;

  // Index into `channel.sortedMessages` at which the rendered window starts.
  // We render from here to the end, so appending new messages at the bottom
  // never shifts the content the user is looking at.
  //
  // TODO: bound the window size while detached and shed older DOM nodes
  // (Element-style, with height reservation) for very deep history. Session
  // message volumes are currently small enough that this is not yet needed.
  @tracked renderedStartIndex = 0;
  @tracked historyLoaded = false;
  @tracked historyLoadFailed = false;

  @cached
  get renderedMessages () {
    return this.args.channel.sortedMessages.slice(this.renderedStartIndex);
  }

  get hasOlderMessages () {
    return this.args.channel.hasOlderMessages;
  }

  // Whether there is anything older to reveal or fetch: either older messages
  // already in memory (window not at the start) or more archive pages. A failed
  // page stops auto-loading (see `historyLoadFailed`) so we don't retry the same
  // failing request in a loop; the user can retry explicitly.
  get canLoadOlderMessages () {
    return !this.historyLoadFailed &&
      (this.renderedStartIndex > 0 || this.args.channel.hasOlderMessages);
  }

  get isLoadingOlderMessages () {
    return this.args.channel.loadingOlderMessages;
  }

  // Only show the "beginning of history" marker once older history has
  // actually been loaded/revealed for this channel.
  get showHistoryStart () {
    return this.historyLoaded && !this.historyLoadFailed && !this.canLoadOlderMessages;
  }

  @action
  channelChanged () {
    const messageCount = this.args.channel.sortedMessages.length;
    this.renderedStartIndex = Math.max(0, messageCount - INITIAL_RENDERED_MESSAGES);
    this.historyLoaded = false;
    this.historyLoadFailed = false;

    setTimeout(() => {
      if (this.isDestroyed || this.isDestroying) return;
      this.menu('global', 'hide');
    }, 500);
  }

  @action
  onAfterRender () {
    // We need to define an empty handler for swipe events on the
    // #channel-content element, so that the actual handler of the app container
    // component gets triggered
    Hammer(document.getElementById('channel-content')).on('swipe', function (){});
  }

  /**
   * Reveals the next page of older messages. Older messages already in memory
   * are revealed first; a new archive page is fetched once the window reaches
   * the beginning of what we have.
   */
  @action
  async loadOlderMessages () {
    const channel = this.args.channel;
    if (channel.loadingOlderMessages) return;

    if (this.renderedStartIndex > 0) {
      this.renderedStartIndex = Math.max(0, this.renderedStartIndex - RENDERED_MESSAGES_INCREMENT);
      this.historyLoaded = true;
      return;
    }

    if (!channel.hasOlderMessages) return;

    const lengthBefore = channel.sortedMessages.length;

    channel.loadingOlderMessages = true;
    this.historyLoaded = true;
    try {
      await this.coms.loadOlderMessages(channel);
    } catch (error) {
      // Stop auto-loading so we don't retry the same failing page in a loop or
      // leave an unhandled rejection; the user can retry explicitly.
      this.historyLoadFailed = true;
      console.error('[channel] Failed to load older messages', error);
      return;
    } finally {
      channel.loadingOlderMessages = false;
    }

    // Keep the currently rendered messages visible and reveal a page of the
    // newly loaded ones. `ChatScroller` restores the scroll position around it.
    if (this.args.channel !== channel || this.isDestroyed || this.isDestroying) return;

    const added = channel.sortedMessages.length - lengthBefore;
    if (added > 0) {
      this.renderedStartIndex = Math.max(0, added - RENDERED_MESSAGES_INCREMENT);
    }
  }

  @action
  retryLoadOlderMessages () {
    this.historyLoadFailed = false;
    this.loadOlderMessages();
  }

  focusMessageInputField () {
    const inputEl = document.querySelector('input#message-field');
    inputEl.focus();
  }

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
  leaveChannel (channel) {
    this.args.onLeaveChannel(channel);
  }

}
