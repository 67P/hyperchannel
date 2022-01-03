import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
import { xmppAccount } from '../../fixtures/accounts';
import sinon from 'sinon';

module('Unit | Service | sockethub xmpp', function(hooks) {
  setupTest(hooks);

  test('#handlePresenceUpdate adds new users to the channel', function(assert) {
    const channel = new Channel({ account: xmppAccount, name: 'some-channel@kosmos.chat' });
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsService });

    const presenceUpdate = {
      actor: { id: 'walter@kosmos.org', name: 'walter' },
      target: { id: 'some-channel@kosmos.chat', type: 'room' },
      object: { presence: 'online' }
    };

    service.handlePresenceUpdate(presenceUpdate);

    assert.ok(channel.userList.includes('walter'));
  });

  test('#handlePresenceUpdate removes offline users from the channel', function(assert) {
    const channel = new Channel({ account: xmppAccount, name: 'some-channel@kosmos.chat' });
    channel.addUser('walter');
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsService });

    const presenceUpdate = {
      actor: { id: 'walter@kosmos.org', name: 'walter' },
      target: { id: 'some-channel@kosmos.chat', type: 'room' },
      object: { presence: 'offline' }
    };

    service.handlePresenceUpdate(presenceUpdate);

    assert.notOk(channel.userList.includes('walter'));
  });

  test('#findOrCreateChannelForMessage returns the channel for a given message', function(assert) {
    const channel = new Channel({ account: xmppAccount, name: 'some-channel@kosmos.chat' });
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsService });

    const message = {
      actor: {
        id: 'some_user@some-server.com/hyperchannel',
        type: 'person',
        name: 'some_user'
      },
      target: {
        id: 'some-channel@kosmos.chat',
        type: 'room',
        name: 'some-channel@kosmos.chat'
      },
      object: {
        type: 'message',
        content: 'hello world'
      }
    };

    assert.equal(service.findOrCreateChannelForMessage(message), channel);
  });

  test('#addMessageToChannel adds the message to the channel', function(assert) {
    const channel = new Channel({ account: xmppAccount, name: 'some-channel@kosmos.chat' });
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsService });

    const message = {
      actor: {
        id: 'some_user@some-server.com/hyperchannel',
        type: 'person',
        name: 'some_user'
      },
      target: {
        id: 'some-channel@kosmos.chat',
        type: 'room',
        name: 'some-channel@kosmos.chat'
      },
      object: {
        type: 'message',
        content: 'hello world'
      }
    };

    service.addMessageToChannel(message);

    assert.equal(channel.messages.lastObject.content, 'hello world');
  });

  test('#addMessageToChannel updates pending status when receiving an outgoing message', function(assert) {
    const channel = new Channel({ account: xmppAccount, name: 'kosmos-dev@kosmos.chat' });
    const outgoingMessage = new Message({
      type: 'message-chat',
      date: new Date(),
      nickname: 'jimmy',
      content: 'yo, gang!',
      pending: true
    });
    channel.messages.pushObject(outgoingMessage);

    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsService });

    const message = {
      actor: { id: 'kosmos-dev@kosmos.chat/jimmy', type: 'person', name: 'jimmy' },
      target: { id: 'kosmos-dev@kosmos.chat', type: 'room' },
      object: { type: 'message', content: 'yo, gang!' }
    };

    service.addMessageToChannel(message);

    assert.equal(channel.messages.filterBy('nickname', 'jimmy').length, 1);
    assert.equal(channel.messages.lastObject.content, 'yo, gang!');
    assert.notOk(channel.messages.lastObject.pending);
  });

  test('#createUserChannel', function(assert) {
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ]
    });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsService });

    const channel = service.createUserChannel(xmppAccount, 'kosmos-dev@kosmos.chat/walter');

    assert.equal(channel.name, 'kosmos-dev@kosmos.chat/walter');
    assert.equal(channel.displayName, 'walter');
    assert.ok(channel.isUserChannel);
    assert.ok(channel.connected);
  });

  test('#transferMessage', function(assert) {
    const channel = new Channel({ account: xmppAccount, name: 'elsalvador@chat.hackerbeach.org' });
    const message = new Message({ content: 'Only 4 days until 2022!', id: 'hc-123abcde'});
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const xmpp = this.owner.factoryFor('service:sockethub-xmpp').create({
      coms: comsService
    });
    const socketEmitSpy = sinon.spy(xmpp.sockethub.socket, 'emit');

    xmpp.transferMessage(channel, message);

    assert.ok(socketEmitSpy.calledOnce, 'emits a sockethub job message');

    const jobMessage = socketEmitSpy.getCall(0).args[1];
    assert.equal(jobMessage.context, 'xmpp', 'job context is correct');
    assert.equal(jobMessage.type, 'send', 'job type is correct');
    assert.equal(jobMessage.object.type, 'message', 'job object type is correct');
    assert.equal(jobMessage.object.content, 'Only 4 days until 2022!', 'job object content is correct');
    assert.equal(jobMessage.object.id, 'hc-123abcde', 'job object contains a message ID');
  });

  test('#transferMessage for correction', function(assert) {
    const channel = new Channel({ account: xmppAccount, name: 'elsalvador@chat.hackerbeach.org' });
    const message = new Message({
      content: 'Only 4 days until 2022!',
      id: 'hc-123abcde', replaceId: 'hc-234ghijk'
    });
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const xmpp = this.owner.factoryFor('service:sockethub-xmpp').create({
      coms: comsService
    });
    const socketEmitSpy = sinon.spy(xmpp.sockethub.socket, 'emit');

    xmpp.transferMessage(channel, message);

    const jobMessage = socketEmitSpy.getCall(0).args[1];
    assert.equal(jobMessage.object.id, 'hc-123abcde', 'job object contains a message ID');
    assert.deepEqual(jobMessage.object.replace, { id: 'hc-234ghijk' }, 'job object contains the replace property');
  });
});
