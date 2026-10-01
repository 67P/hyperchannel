import { tracked } from '@glimmer/tracking';

export default class Message {

  @tracked type = null;
  @tracked date = null;
  @tracked nickname = null;
  @tracked content = null;
  @tracked pending = null;
  @tracked edited = false;
  @tracked grouped = false;

  // Stable identity used for list keys and scroll anchoring. Assigned by
  // `BaseChannel.addMessage` / `addDateHeadline`; see `utils/message-key`.
  key = null;

  constructor (props) {
    Object.assign(this, props);
  }

}
