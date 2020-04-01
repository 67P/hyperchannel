import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';

module('Unit | Model | channel', function(hooks) {
  setupTest(hooks);

  test('#formattedTopic turns URLs into links', function(assert) {
    const channel = new Channel();
    channel.topic = 'visit kosmos.org for more info';

    assert.equal(channel.formattedTopic.toString(), 'visit <a href="https://kosmos.org" class="linkified" target="_blank" rel="nofollow">kosmos.org</a> for more info');
  });

  test('#formattedTopic escapes HTML', function(assert) {
    const channel = new Channel();
    channel.topic = 'never gonna <marquee>give you up</marquee>';

    assert.equal(channel.formattedTopic.toString(), 'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;');
  });

  test('#shortName for IRC returns name without hash', function(assert) {
    const space = new Space({ protocol: 'IRC' });
    const channel = new Channel({ space: space, name: '#kosmos-dev' });

    assert.equal(channel.shortName, 'kosmos-dev');
  });

  test('#shortName for XMPP returns name without MUC domain', function(assert) {
    const space = new Space({ protocol: 'XMPP' });
    const channel = new Channel({ space: space, name: 'kosmos-dev@kosmos.chat' });

    assert.equal(channel.shortName, 'kosmos-dev');
  });

});

