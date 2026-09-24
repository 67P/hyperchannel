import Component from '@glimmer/component';
import { ircRole, stripIrcRolePrefix } from 'hyperchannel/utils/irc-username';
import buildUserChannelId from 'hyperchannel/utils/user-channel-id';

export default class LinkToUsernameComponent extends Component {

  get role () {
    return ircRole(this.args.username);
  }

  get usernameWithoutPrefix () {
    return stripIrcRolePrefix(this.args.username);
  }

  get userChannelId () {
    return buildUserChannelId(this.args.channel, this.usernameWithoutPrefix);
  }

}
