import Service from '@ember/service';

export default class LoggerService extends Service {

  enabled = true;
  allowedTypes;
  activeTypes;

  constructor () {
    super(...arguments);

    this.allowedTypes = [
      'connection',
      'error',
      'join',
      'leave',
      'message',
      'irc_message',
      'xmpp_message',
      'send',
      'xmpp_completed',
      'irc_completed',
      'sh_completed',
      'sh_failure',
      'irc',
      'xmpp',
      'fetch-error',
      'chat_message'
    ];

    this.activeTypes = [
      'connection',
      'error',
      'join',
      'leave',
      'send',
      'sh_completed',
      'xmpp_completed',
      'irc_completed',
      'sh_failure',
      'irc',
      'xmpp',
      'message',
      'irc_message',
      'xmpp_message'
    ];
  }

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
    this.activeTypes.addObject(type);
  }

  remove (type) {
    this.activeTypes.removeObject(type);
  }

  disable () {
    this.enabled = false;
  }

  enable () {
    this.enabled = true;
  }
}
