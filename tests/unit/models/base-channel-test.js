import { moduleFor, test } from 'ember-qunit';
import Message from 'hyperchannel/models/message';
import moment from 'moment';

moduleFor('model:base-channel', 'Unit | Model | base-channel');

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

//
// sortedMessages
//

test('#sortedMessages returns an empty array if there are no messages', function(assert) {
  let channel = this.subject();

  assert.equal(typeof channel.get('sortedMessages'), 'object');
  assert.equal(channel.get('sortedMessages').length, 0);
});

//
// addDateHeadline
//

test('#addDateHeadline adds a date-headline when none exists yet', function(assert) {
  let channel = this.subject();
  channel.addDateHeadline(
    Message.create({
      type: 'message-chat',
      date: new Date(),
      message: 'hi'
    })
  );

  assert.equal(channel.get('sortedMessages').length, 1, 'has no messages');
  let firstMessage = channel.get('sortedMessages.firstObject');
  assert.equal(firstMessage.get('type'), 'date-headline', 'has the wrong type');
});

test('#addDateHeadline does not add a date-headline when one exists already', function(assert) {
  let channel = this.subject();

  channel.get('messages').pushObject(
    Message.create({
      type: 'date-headline',
      date: moment().startOf('day').toDate(),
      message: 'old message'
    })
  );

  channel.addDateHeadline(
    Message.create({
      type: 'message-chat',
      date: new Date(),
      message: 'new message'
    })
  );

  assert.equal(channel.get('sortedMessages').length, 1);
});
