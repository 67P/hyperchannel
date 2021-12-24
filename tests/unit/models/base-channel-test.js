import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Message from 'hyperchannel/models/message';
import BaseChannel from 'hyperchannel/models/base_channel';
import { ircAccount, xmppAccount } from '../../fixtures/accounts';
import moment from 'moment';
import sinon from 'sinon';

module('Unit | Model | base-channel', function(hooks) {
  setupTest(hooks);

  test('#slug', function(assert) {
    const model = new BaseChannel({
      account: ircAccount,
      name: '#kosmos-dev'
    });

    assert.equal(model.slug, 'kosmos-dev@irc.libera.chat');
  });

  //
  // unreadMessagesClass
  //

  test('#unreadMessagesClass is null when channel is visible', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });
    channel.unreadMessages = true;
    channel.visible = true;

    assert.equal(channel.unreadMessagesClass, null);
  });

  test('#unreadMessagesClass is null when channel has no unread messages', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });
    channel.unreadMessages = false;
    channel.visible = false;

    assert.equal(channel.unreadMessagesClass, null);
  });

  test('#unreadMessagesClass is correct for unread messages', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });
    channel.unreadMessages = true;
    channel.unreadMentions = false;
    channel.visible = false;

    assert.equal(channel.unreadMessagesClass, 'unread-messages');
  });

  test('#unreadMessagesClass is correct for unread mentions', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });
    channel.unreadMessages = true;
    channel.unreadMentions = true;
    channel.visible = false;

    assert.equal(channel.unreadMessagesClass, 'unread-mentions');
  });

  //
  // sortedMessages
  //

  test('#sortedMessages returns an empty array if there are no messages', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });

    assert.ok(Array.isArray(channel.sortedMessages));
    assert.equal(channel.sortedMessages.length, 0);
  });

  //
  // sortedUserList
  //

  test('#sortedUserList returns an empty array if there are no users', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });

    assert.ok(Array.isArray(channel.sortedUserList));
    assert.equal(channel.sortedUserList.length, 0);
  });

  test('#sortedUserList returns a list of sorted usernames', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });

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
    const channel = new BaseChannel({ account: xmppAccount });
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
    const channel = new BaseChannel({ account: xmppAccount });

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
  // addMessage
  //

  test('#addMessage', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });
    const addDateHeadlineStub = sinon.stub(channel, 'addDateHeadline');
    const replaceMessage = sinon.stub(channel, 'replaceMessage');

    channel.messages.pushObject(new Message({
      type: 'message-chat', date: new Date(), id: '123bca',
      content: 'Once we accept our limits, we go beyond them.'
    }));

    const newMessage = new Message({
      type: 'message-chat', date: new Date(), id: '234abc',
      content: 'Human beings, vegetables, or cosmic dust, we all dance to a mysterious tune, intoned in the distance by an invisible piper.'
    });

    channel.addMessage(newMessage);

    assert.equal(channel.messages.filterBy('type', 'message-chat').length, 2,
                 'adds the new message');

    assert.ok(addDateHeadlineStub.calledOnce);
    assert.ok(addDateHeadlineStub.calledWith(newMessage));
    assert.notOk(replaceMessage.calledOnce);
  });

  test('#addMessage for message correction', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });
    const addDateHeadlineStub = sinon.stub(channel, 'addDateHeadline');
    const replaceMessage = sinon.stub(channel, 'replaceMessage');

    channel.messages.pushObject(new Message({
      type: 'message-chat', date: new Date(), id: '123bca',
      content: 'Once we accept our limits, we go beyond them.'
    }));

    const newMessage = new Message({
      type: 'message-chat', date: new Date(), id: '234abc',
      content: 'Human beings, vegetables, or cosmic dust, we all dance to a mysterious tune, intoned in the distance by an invisible piper.',
      replaceId: '123bca'
    });

    channel.addMessage(newMessage);

    assert.equal(channel.messages.filterBy('type', 'message-chat').length, 1,
                 'does not add a new message');

    assert.ok(replaceMessage.calledOnce);
    assert.ok(replaceMessage.calledWith(newMessage));
    assert.notOk(addDateHeadlineStub.calledOnce);
  });

  //
  // replaceMessage
  //

  test('#replaceMessage', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });

    channel.messages.pushObject(new Message({
      type: 'message-chat', date: new Date(),
      id: '234abc', content: 'Merry Christmus, Mr. Klaus!'
    }));

    const newMessage = new Message({
      type: 'message-chat', date: new Date(),
      id: '678abc', content: 'Merry Christmas, Mr. Klaus!',
      replaceId: '234abc'
    });

    channel.replaceMessage(newMessage);

    const oldMessage = channel.messages.findBy('id', '234abc');

    assert.equal(oldMessage.content, newMessage.content, 'replaces the message content');
    assert.true(oldMessage.edited, 'marks the old message as edited');
  });

  //
  // isLogged
  // TODO Re-implement without custom space/network IDs
  //

  // test('#isLogged returns true when channel is logged', function(assert) {
  //   const channel = new BaseChannel({
  //     account: xmppAccount,
  //     name: '#kosmos'
  //   });
  //
  //   assert.ok(channel.isLogged);
  // });
  //
  // test('#isLogged returns false when channel is not logged', function(assert) {
  //   const channel = new BaseChannel({
  //     account: xmppAccount,
  //     name: '#some-random-chan'
  //   });
  //
  //   assert.notOk(channel.isLogged);
  // });

  //
  // addUser
  //

  test('#addUser adds a user to the list', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });
    channel.addUser('some-random-user');

    assert.ok(channel.userList.includes('some-random-user'));
  });

  test('#addUser does not add duplicates', function(assert) {
    const channel = new BaseChannel({ account: xmppAccount });
    channel.addUser('some-random-user');
    channel.addUser('some-random-user');

    assert.deepEqual(channel.userList, ['some-random-user']);
  });

  test('#domain (XMPP)', function(assert) {
    let channel = new BaseChannel({
      account: xmppAccount,
      name: 'kosmos-dev@kosmos.chat'
    });
    assert.equal(channel.domain, 'kosmos.chat', 'returns the MUC domain for rooms');

    channel = new BaseChannel({
      account: xmppAccount,
      isUserChannel: true,
      name: 'kosmos-dev@kosmos.chat/jimmy'
    });
    assert.equal(channel.domain, 'kosmos.chat', 'returns the MUC domain for direct message channels');
  });

  test('#domain (IRC)', function(assert) {
    const channel = new BaseChannel({
      account: ircAccount,
      name: '#kosmos-dev'
    });
    assert.equal(channel.domain, 'irc.libera.chat', 'returns the network/account domain');
  });
});
