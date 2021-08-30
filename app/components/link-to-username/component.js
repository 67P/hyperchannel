import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isPresent, isEmpty } from '@ember/utils';

export default class LinkToUsernameComponent extends Component {

  @tracked roles = {
    '@': 'op',
    '%': 'half-op',
    '+': 'voice'
  };

  get role () {
    if (isEmpty(this.args.username)) return 'normal';

    const role = this.roles[this.args.username[0]];
    return isPresent(role) ? role : 'normal';
  }

  get usernameWithoutPrefix () {
    if (isEmpty(this.args.username)) return null;

    const regex = RegExp(`^[\\${Object.keys(this.roles).join('\\')}]`);
    return this.args.username.replace(regex, '');
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
