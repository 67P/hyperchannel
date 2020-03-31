import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';

module('Unit | Model | channel', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const model = new Channel();
    assert.ok(!!model);
  });


  //
  // formattedTopic
  //

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
});

