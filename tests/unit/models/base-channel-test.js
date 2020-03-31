import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Message from 'hyperchannel/models/message';
import Space from 'hyperchannel/models/space';
import BaseChannel from 'hyperchannel/models/base_channel';
import moment from 'moment';

module('Unit | Model | base-channel', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const model = new BaseChannel();
    assert.ok(!!model);
  });

  test('#slug', function(assert) {
    const model = new BaseChannel({ name: '#kosmos-dev' });

    assert.ok(model.slug === 'kosmos-dev');
  });


  //
  // unreadMessagesClass
  //

  test('#unreadMessagesClass is null when channel is visible', function(assert) {
    const channel = new BaseChannel();
    channel.unreadMessages = true;
    channel.visible = true;

    assert.equal(channel.unreadMessagesClass, null);
  });

  test('#unreadMessagesClass is null when channel has no unread messages', function(assert) {
    const channel = new BaseChannel();
    channel.unreadMessages = false;
    channel.visible = false;

    assert.equal(channel.unreadMessagesClass, null);
  });

  test('#unreadMessagesClass is correct for unread messages', function(assert) {
    const channel = new BaseChannel();
    channel.unreadMessages = true;
    channel.unreadMentions = false;
    channel.visible = false;

    assert.equal(channel.unreadMessagesClass, 'unread-messages');
  });

  test('#unreadMessagesClass is correct for unread mentions', function(assert) {
    const channel = new BaseChannel();
    channel.unreadMessages = true;
    channel.unreadMentions = true;
    channel.visible = false;

    assert.equal(channel.unreadMessagesClass, 'unread-mentions');
  });

  //
  // sortedMessages
  //

  test('#sortedMessages returns an empty array if there are no messages', function(assert) {
    const channel = new BaseChannel();

    assert.ok(Array.isArray(channel.sortedMessages));
    assert.equal(channel.sortedMessages.length, 0);
  });

  //
  // sortedUserList
  //

  test('#sortedUserList returns an empty array if there are no users', function(assert) {
    const channel = new BaseChannel();

    assert.ok(Array.isArray(channel.sortedUserList));
    assert.equal(channel.sortedUserList.length, 0);
  });

  test('#sortedUserList returns a list of sorted usernames', function(assert) {
    const channel = new BaseChannel();

    channel.userList = ['silverbucket', 'XioNox', 'raucau', '@operator',
                        'gregkare', 'galfert', '@MrOps', '~TheOwner',
                        '&DaAdmin', '%HalfOp', '+TheVoice'];

    assert.deepEqual(channel.sortedUserList, ['@MrOps', '@operator', '&DaAdmin',
                                              '%HalfOp', '+TheVoice', '~TheOwner',
                                              'galfert', 'gregkare', 'raucau',
                                              'silverbucket', 'XioNox']);
  });

  //
  // addDateHeadline
  //

  test('#addDateHeadline adds a date-headline when none exists yet', function(assert) {
    const channel = new BaseChannel();
    channel.addDateHeadline(
      new Message({
        type: 'message-chat',
        date: new Date(),
        message: 'hi'
      })
    );

    assert.equal(channel.sortedMessages.length, 1, 'has no messages');
    let firstMessage = channel.sortedMessages.firstObject;
    assert.equal(firstMessage.type, 'date-headline', 'has the wrong type');
  });

  test('#addDateHeadline does not add a date-headline when one exists already', function(assert) {
    const channel = new BaseChannel();

    channel.messages.pushObject(
      new Message({
        type: 'date-headline',
        date: moment().startOf('day').toDate(),
        message: 'old message'
      })
    );

    channel.addDateHeadline(
      new Message({
        type: 'message-chat',
        date: new Date(),
        message: 'new message'
      })
    );

    assert.equal(channel.sortedMessages.length, 1);
  });

  //
  // isLogged
  //

  test('#isLogged returns true when channel is logged', function(assert) {
    const space = new Space({ name: 'Freenode' });
    const channel = new BaseChannel({
      space: space,
      name: '#kosmos'
    });

    assert.ok(channel.isLogged);
  });

  test('#isLogged returns false when channel is not logged', function(assert) {
    const space = new Space({ name: 'Freenode' });
    const channel = new BaseChannel({
      space: space,
      name: '#some-random-chan'
    });

    assert.notOk(channel.isLogged);
  });

  //
  // addUser
  //

  test('#addUser adds a user to the list', function(assert) {
    const space = new Space({ name: 'Freenode' });
    const channel = new BaseChannel({
      space: space,
      name: '#some-random-chan'
    });

    channel.addUser('some-random-user');

    assert.ok(channel.userList.includes('some-random-user'));
  });

  test('#addUser does not add duplicates', function(assert) {
    const space = new Space({ name: 'Freenode' });
    const channel = new BaseChannel({
      space: space,
      name: '#some-random-chan'
    });

    channel.addUser('some-random-user');
    channel.addUser('some-random-user');

    assert.deepEqual(channel.userList, ['some-random-user']);
  });
});
