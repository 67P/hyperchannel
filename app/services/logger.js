import Service from '@ember/service';

export default class LoggerService extends Service {

  enabled = true;

  allowedTypes = [
    'sockethub',
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

  activeTypes = [
    'sockethub',
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
  ];

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
