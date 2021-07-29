import Account from 'hyperchannel/models/account';

export default class IrcAccount extends Account {

  protocol = 'IRC';

  get userAddress () {
    return `${this.nickname}@${this.server.hostname}`;
  }

  get sockethubPersonId () {
    return this.userAddress;
  }

}
