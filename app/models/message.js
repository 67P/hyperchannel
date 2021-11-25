import { tracked } from '@glimmer/tracking';

export default class Message {
  @tracked type = null;
  @tracked date = null;
  @tracked nickname = null;
  @tracked content = null;
  @tracked pending = null;

  constructor(props) {
    Object.assign(this, props);
  }
}
