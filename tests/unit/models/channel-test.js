import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';
import { ircAccount, xmppAccount } from '../../fixtures/accounts';

module('Unit | Model | channel', function (hooks) {
  setupTest(hooks);

  test('#formattedTopic with no topic available', function (assert) {
    const channel = new Channel({ account: xmppAccount });

    assert.strictEqual(channel.formattedTopic.toString(), '', 'returns an empty string');
  });

  test('#formattedTopic turns URLs into links', function (assert) {
    const channel = new Channel({ account: xmppAccount });
    channel.topic = 'visit kosmos.org for more info';

    assert.strictEqual(channel.formattedTopic.toString(), 'visit <a href="https://kosmos.org" rel="nofollow noopener" target="_blank">kosmos.org</a> for more info');
  });

  test('#formattedTopic escapes HTML', function (assert) {
    const channel = new Channel({ account: xmppAccount });
    channel.topic = 'never gonna <marquee>give you up</marquee>';

    assert.strictEqual(channel.formattedTopic.toString(), 'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;');
  });

  test('#publicLogsBaseUrl keeps single-hash channels unencoded', function (assert) {
    const channel = new Channel({
      account: ircAccount,
      name: '#kosmos-dev'
    });
    assert.strictEqual(channel.publicLogsBaseUrl, 'https://storage.5apps.com/kosmos/public/chat-messages/irc.libera.chat/channels/kosmos-dev');
  });

  test('#publicLogsBaseUrl percent-encodes all hashes for multi-hash channels', function (assert) {
    const channel = new Channel({
      account: ircAccount,
      name: '##kosmos-dev'
    });
    const baseUrl = channel.publicLogsBaseUrl;
    assert.ok(!baseUrl.includes('#'), 'logs URL has no fragment');
    assert.strictEqual(baseUrl, 'https://storage.5apps.com/kosmos/public/chat-messages/irc.libera.chat/channels/%23%23kosmos-dev');
  });
});
