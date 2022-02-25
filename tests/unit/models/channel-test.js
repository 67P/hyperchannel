import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';
import { ircAccount, xmppAccount } from '../../fixtures/accounts';

module('Unit | Model | channel', function(hooks) {
  setupTest(hooks);

  test('#formattedTopic turns URLs into links', function(assert) {
    const channel = new Channel({ account: xmppAccount });
    channel.topic = 'visit kosmos.org for more info';

    assert.equal(channel.formattedTopic.toString(), 'visit <a href="https://kosmos.org" rel="nofollow noopener" target="_blank">kosmos.org</a> for more info');
  });

  test('#formattedTopic escapes HTML', function(assert) {
    const channel = new Channel({ account: xmppAccount });
    channel.topic = 'never gonna <marquee>give you up</marquee>';

    assert.equal(channel.formattedTopic.toString(), 'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;');
  });

  test('#shortName', function(assert) {
    let channel = new Channel({
      account: ircAccount,
      name: '#kosmos-dev'
    });
    assert.equal(channel.shortName, 'kosmos-dev', 'returns name without hash for IRC');

    channel = new Channel({
      account: xmppAccount,
      name: 'kosmos-dev@kosmos.chat'
    });
    assert.equal(channel.shortName, 'kosmos-dev', 'returns name without MUC domain for XMPP');
  });
});
