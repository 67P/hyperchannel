import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';

module('Unit | Model | channel', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const model = Channel.create();
    assert.ok(!!model);
  });


  //
  // formattedTopic
  //

  test('#formattedTopic turns URLs into links', function(assert) {
    const channel = Channel.create();
    channel.set('topic', 'visit kosmos.org for more info');

    assert.equal(channel.get('formattedTopic').toString(), 'visit <a href="https://kosmos.org" class="linkified" target="_blank" rel="nofollow">kosmos.org</a> for more info');
  });

  test('#formattedTopic escapes HTML', function(assert) {
    const channel = Channel.create();
    channel.set('topic', 'never gonna <marquee>give you up</marquee>');

    assert.equal(channel.get('formattedTopic').toString(), 'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;');
  });
});

