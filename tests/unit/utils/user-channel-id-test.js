import { module, test } from 'qunit';
import userChannelId from 'hyperchannel/utils/user-channel-id';
import Channel from 'hyperchannel/models/channel';
import { ircAccount, xmppAccount } from '../../fixtures/accounts';

module('Unit | Utility | user channel id', function () {
  test('builds an IRC user channel id from nickname and network hostname', function (assert) {
    const channel = new Channel({ account: ircAccount, name: '#kosmos' });

    assert.strictEqual(userChannelId(channel, 'alice'), 'alice@irc.libera.chat');
  });

  test('builds an XMPP user channel id with a literal slash', function (assert) {
    const channel = new Channel({ account: xmppAccount, name: 'kosmos-dev@kosmos.chat' });

    assert.strictEqual(userChannelId(channel, 'alice'), 'kosmos-dev@kosmos.chat/alice');
  });
});
