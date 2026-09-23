import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

/**
 * Minimal replacement for ember-promise-modals. The only modals in the app are
 * the settings/account list and the join-channel dialog, so a couple of tracked
 * booleans are enough and avoid dynamic component resolution.
 */
export default class ModalsService extends Service {

  @tracked settingsOpen = false;
  @tracked joinChannelOpen = false;

  @action
  openSettings () {
    this.settingsOpen = true;
  }

  @action
  closeSettings () {
    this.settingsOpen = false;
  }

  @action
  openJoinChannel () {
    this.joinChannelOpen = true;
  }

  @action
  closeJoinChannel () {
    this.joinChannelOpen = false;
  }

  @action
  closeAll () {
    this.settingsOpen = false;
    this.joinChannelOpen = false;
  }
}
