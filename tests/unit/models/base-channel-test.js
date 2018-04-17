import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Message from 'hyperchannel/models/message';
import Space from 'hyperchannel/models/space';
import BaseChannel from 'hyperchannel/models/base_channel';
import moment from 'moment';

module('Unit | Model | base-channel', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const model = BaseChannel.create();
    assert.ok(!!model);
  });

  test('#slug', function(assert) {
    const model = BaseChannel.create();
    model.set('name', '#kosmos-dev');

    assert.ok(model.get('slug') === 'kosmos-dev');
  });


  //
  // unreadMessagesClass
  //

  test('#unreadMessagesClass is null when channel is visible', function(assert) {
    const channel = BaseChannel.create();
    channel.set('unreadMessages', true);
    channel.set('visible', true);

    assert.equal(channel.get('unreadMessagesClass'), null);
  });

  test('#unreadMessagesClass is null when channel has no unread messages', function(assert) {
    const channel = BaseChannel.create();
    channel.set('unreadMessages', false);
    channel.set('visible', false);

    assert.equal(channel.get('unreadMessagesClass'), null);
  });

  test('#unreadMessagesClass is correct for unread messages', function(assert) {
    const channel = BaseChannel.create();
    channel.set('unreadMessages', true);
    channel.set('unreadMentions', false);
    channel.set('visible', false);

    assert.equal(channel.get('unreadMessagesClass'), 'unread-messages');
  });

  test('#unreadMessagesClass is correct for unread mentions', function(assert) {
    const channel = BaseChannel.create();
    channel.set('unreadMessages', true);
    channel.set('unreadMentions', true);
    channel.set('visible', false);

    assert.equal(channel.get('unreadMessagesClass'), 'unread-mentions');
  });

  //
  // sortedMessages
  //

  test('#sortedMessages returns an empty array if there are no messages', function(assert) {
    const channel = BaseChannel.create();

    assert.equal(typeof channel.get('sortedMessages'), 'object');
    assert.equal(channel.get('sortedMessages').length, 0);
  });

  //
  // sortedUserList
  //

  test('#sortedUserList returns an empty array if there are no users', function(assert) {
    const channel = BaseChannel.create();

    assert.equal(typeof channel.get('sortedUserList'), 'object');
    assert.equal(channel.get('sortedUserList').length, 0);
  });

  test('#sortedUserList returns a list of sorted usernames', function(assert) {
    const channel = BaseChannel.create();

    channel.set('userList', ['silverbucket', 'XioNox', 'raucau', '@operator',
                             'gregkare', 'galfert', '@MrOps']);

    assert.deepEqual(channel.get('sortedUserList'), ['@MrOps', '@operator', 'galfert',
                                                     'gregkare', 'raucau', 'silverbucket',
                                                     'XioNox']);
  });

  //
  // addDateHeadline
  //

  test('#addDateHeadline adds a date-headline when none exists yet', function(assert) {
    const channel = BaseChannel.create();
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
    const channel = BaseChannel.create();

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

  //
  // isLogged
  //

  test('#isLogged returns true when channel is logged', function(assert) {
    const space = Space.create();
    space.set('name', 'Freenode');
    const channel = BaseChannel.create({
      space: space,
      name: '#kosmos'
    });

    assert.ok(channel.get('isLogged'));
  });

  test('#isLogged returns false when channel is not logged', function(assert) {
    const space = Space.create();
    space.set('name', 'Freenode');
    const channel = BaseChannel.create({
      space: space,
      name: '#some-random-chan'
    });

    assert.notOk(channel.get('isLogged'));
  });

  //
  // addUser
  //

  test('#addUser adds a user to the list', function(assert) {
    const space = Space.create();
    space.set('name', 'Freenode');
    const channel = BaseChannel.create({
      space: space,
      name: '#some-random-chan'
    });

    channel.addUser('some-random-user');

    assert.ok(channel.get('userList').includes('some-random-user'));
  });

  test('#addUser does not add duplicates', function(assert) {
    const space = Space.create();
    space.set('name', 'Freenode');
    const channel = BaseChannel.create({
      space: space,
      name: '#some-random-chan'
    });

    channel.addUser('some-random-user');
    channel.addUser('some-random-user');

    assert.deepEqual(channel.get('userList'), ['some-random-user']);
  });
});
