import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { TrackedArray } from 'tracked-built-ins';

export default class LoggerService extends Service {

  @tracked enabled = true;

  allowedTypes = [
    'error',
    'join',
    'leave',
    'message',
    'irc_message',
    'xmpp_message',
    'send',
    'irc',
    'xmpp',
    'fetch-error',
    'chat_message',
    'storage',
  ];

  activeTypes = new TrackedArray([
    'error',
    'join',
    'leave',
    'send',
    'irc',
    'xmpp',
    'xmpp_message',
    'message',
    'irc_message',
    'storage'
  ]);

  log (type) {
    if (!this.allowedTypes.includes(type)) {
      throw new Error(`You specified a unknown type: "${type}".`);
    }

    if (this.activeTypes.includes(type) && this.enabled) {
      var params = Array.prototype.slice.call(arguments);
      params[0] = `[${params[0]}]`;
      console.debug.apply(null, params);
    }
  }

  add (type) {
    this.activeTypes.push(type);
  }

  remove (type) {
    const index = this.activeTypes.indexOf(type);
    if (index > -1) {
      this.activeTypes.splice(index, 1);
    }
  }

  disable () {
    this.enabled = false;
  }

  enable () {
    this.enabled = true;
  }
}
