import Account from 'hyperchannel/models/account';

export default class XmppAccount extends Account {
  protocol = 'XMPP';

  get userAddress() {
    return this.username; // JID
  }

  get sockethubPersonId() {
    return `${this.userAddress}/hyperchannel`;
  }
}
