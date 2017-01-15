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

//
// formattedTopic
//

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

//
// unreadMessagesClass
//

test('#unreadMessagesClass is null when channel is visible', function(assert) {
  var channel = this.subject();
  channel.set('unreadMessages', true);
  channel.set('visible', true);

  assert.equal(channel.get('unreadMessagesClass'), null);
});

test('#unreadMessagesClass is null when channel has no unread messages', function(assert) {
  var channel = this.subject();
  channel.set('unreadMessages', false);
  channel.set('visible', false);

  assert.equal(channel.get('unreadMessagesClass'), null);
});

test('#unreadMessagesClass is correct for unread messages', function(assert) {
  var channel = this.subject();
  channel.set('unreadMessages', true);
  channel.set('unreadMentions', false);
  channel.set('visible', false);

  assert.equal(channel.get('unreadMessagesClass'), 'unread-messages');
});

test('#unreadMessagesClass is correct for unread mentions', function(assert) {
  var channel = this.subject();
  channel.set('unreadMessages', true);
  channel.set('unreadMentions', true);
  channel.set('visible', false);

  assert.equal(channel.get('unreadMessagesClass'), 'unread-mentions');
});
