import { moduleFor, test } from 'ember-qunit';

moduleFor('model:channel', 'Unit | Model | channel');

test('it exists', function(assert) {
  let model = this.subject();
  assert.ok(!!model);
});

test('#slug', function(assert) {
  var model = this.subject();
  model.set('name', '#kosmos-dev');

  assert.ok(model.get('slug') === 'kosmos-dev');
});

test('#formattedTopic turns URLs into links', function(assert) {
  var channel = this.subject();
  channel.set('topic', 'visit kosmos.org for more info');

  assert.equal(channel.get('formattedTopic').toString(), 'visit <a href="https://kosmos.org" class="linkified" target="_blank" rel="nofollow">kosmos.org</a> for more info');
});

test('#formattedTopic escapes HTML', function(assert) {
  var channel = this.subject();
  channel.set('topic', 'never gonna <marquee>give you up</marquee>');

  assert.equal(channel.get('formattedTopic').toString(), 'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;');
});
