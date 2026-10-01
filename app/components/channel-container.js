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
  // `null` means "auto": render the latest `INITIAL_RENDERED_MESSAGES`. This is
  // the initial state and is important because the IRC archive is loaded
  // asynchronously after the component mounts; deriving the window from the live
  // message list (rather than sizing it once at mount) means the initial batch
  // is windowed correctly. It becomes a fixed index once the user starts reading
  // older history.
  //
  // TODO: bound the window size while detached and shed older DOM nodes
  // (Element-style, with height reservation) for very deep history. Session
  // message volumes are currently small enough that this is not yet needed.
  @tracked renderedStartIndex = null;
  @tracked historyLoaded = false;
  @tracked historyLoadFailed = false;

  @cached
  get renderedMessages () {
    const all = this.args.channel.sortedMessages;
    if (this.renderedStartIndex === null) {
      return all.slice(Math.max(0, all.length - INITIAL_RENDERED_MESSAGES));
    }
    return all.slice(this.renderedStartIndex);
  }

  get hasOlderMessages () {
    return this.args.channel.hasOlderMessages;
  }

  // Whether there is anything older to reveal or fetch: either older messages
  // already in memory (window not at the start) or more archive pages. A failed
  // page stops auto-loading (see `historyLoadFailed`) so we don't retry the same
  // failing request in a loop; the user can retry explicitly.
  get canLoadOlderMessages () {
    if (this.historyLoadFailed) return false;
    const channel = this.args.channel;
    if (this.renderedStartIndex === null) {
      return channel.hasOlderMessages || channel.sortedMessages.length > INITIAL_RENDERED_MESSAGES;
    }
    return this.renderedStartIndex > 0 || channel.hasOlderMessages;
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
    // `null` = auto-window the latest messages (see `renderedStartIndex`).
    this.renderedStartIndex = null;
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

    if (this.renderedStartIndex === null) {
      // Materialize the auto-window and reveal one increment of older messages.
      const length = channel.sortedMessages.length;
      this.renderedStartIndex = Math.max(
        0,
        length - INITIAL_RENDERED_MESSAGES - RENDERED_MESSAGES_INCREMENT
      );
      this.historyLoaded = true;
      // Only stop here when the auto-window was actually hiding older in-memory
      // messages (`length > INITIAL_RENDERED_MESSAGES`). For a short channel the
      // window already showed everything, so this revealed nothing and the DOM
      // won't resize to re-trigger auto-loading — fall through and fetch an
      // archive page instead of returning without making progress.
      if (length > INITIAL_RENDERED_MESSAGES) return;
    }

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
      // Guard against the channel having changed or the component being torn
      // down while the request was in flight, so we don't show the new
      // channel's retry error or hide its history loading.
      if (this.args.channel !== channel || this.isDestroyed || this.isDestroying) return;
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
