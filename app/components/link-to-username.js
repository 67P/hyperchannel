import Component from '@glimmer/component';
import { ircRole, stripIrcRolePrefix } from 'hyperchannel/utils/irc-username';

export default class LinkToUsernameComponent extends Component {

  get role () {
    return ircRole(this.args.username);
  }

  get usernameWithoutPrefix () {
    return stripIrcRolePrefix(this.args.username);
  }

  get userChannelId () {
    let id;
    switch (this.args.channel.protocol) {
      case 'IRC':
        id = `${this.usernameWithoutPrefix}@${this.args.channel.domain}`;
        break;
      case 'XMPP':
        id = `${this.args.channel.id}${encodeURIComponent('/')}${this.usernameWithoutPrefix}`;
        break;
    }
    return id;
  }

}
