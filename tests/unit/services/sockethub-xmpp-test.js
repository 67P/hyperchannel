import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
import { xmppAccount } from '../../fixtures/accounts';
import sinon from 'sinon';

function createMockSockethubService () {
  const emittedEvents = [];

  return {
    contextFor () {
      return [
        'https://www.w3.org/ns/activitystreams',
        'https://sockethub.org/ns/v0',
        'https://sockethub.org/ns/context/xmpp'
      ];
    },
    client: {
      socket: {
        emit (event, content, callback) {
          emittedEvents.push({ event, content, callback });
        }
      },
      _emittedEvents: emittedEvents
    }
  };
}

module('Unit | Service | sockethub xmpp', function (hooks) {
  setupTest(hooks);

  test('#handlePresenceUpdate adds new users to the channel', function (assert) {
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

  test('#handlePresenceUpdate removes offline users from the channel', function (assert) {
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

  test('#findOrCreateChannelForMessage returns the channel for a given message', function (assert) {
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

    assert.strictEqual(service.findOrCreateChannelForMessage(message), channel);
  });

  test('#addMessageToChannel adds the message to the channel', function (assert) {
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

    assert.strictEqual(channel.messages.at(-1).content, 'hello world');
  });

  test('#addMessageToChannel updates pending status when receiving an outgoing message', function (assert) {
    const channel = new Channel({ account: xmppAccount, name: 'kosmos-dev@kosmos.chat' });
    const outgoingMessage = new Message({
      type: 'message-chat',
      date: new Date(),
      nickname: 'jimmy',
      content: 'yo, gang!',
      pending: true
    });
    channel.messages.push(outgoingMessage);

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

    assert.strictEqual(channel.messages.filter(m => m.nickname === 'jimmy').length, 1);
    assert.strictEqual(channel.messages.at(-1).content, 'yo, gang!');
    assert.notOk(channel.messages.at(-1).pending);
  });

  test('#createUserChannel', function (assert) {
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ]
    });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsService });

    const channel = service.createUserChannel(xmppAccount, 'kosmos-dev@kosmos.chat/walter');

    assert.strictEqual(channel.name, 'kosmos-dev@kosmos.chat/walter');
    assert.strictEqual(channel.displayName, 'walter');
    assert.ok(channel.isUserChannel);
    assert.ok(channel.connected);
  });

  test('#transferMessage', function (assert) {
    const channel = new Channel({ account: xmppAccount, name: 'elsalvador@chat.hackerbeach.org' });
    const message = new Message({ content: 'Only 4 days until 2022!', id: 'hc-123abcde'});
    const coms = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const mockSockethub = createMockSockethubService();
    const xmpp = this.owner.factoryFor('service:sockethub-xmpp').create({
      sockethub: mockSockethub, coms
    });
    const socketEmitSpy = sinon.spy(mockSockethub.client.socket, 'emit');

    const target = { id: channel.sockethubChannelId, type: 'room', name: channel.name };

    xmpp.transferMessage(target, message);

    assert.ok(socketEmitSpy.calledOnce, 'emits a sockethub job message');

    const jobMessage = socketEmitSpy.getCall(0).args[1];
    assert.strictEqual(jobMessage.type, 'send', 'job type is correct');
    assert.strictEqual(jobMessage.object.type, 'message', 'job object type is correct');
    assert.strictEqual(jobMessage.object.content, 'Only 4 days until 2022!', 'job object content is correct');
    assert.strictEqual(jobMessage.object.id, 'hc-123abcde', 'job object contains a message ID');
    assert.ok(Array.isArray(jobMessage['@context']), '@context is an array');
  });

  test('#transferMessage for correction', function (assert) {
    const channel = new Channel({ account: xmppAccount, name: 'elsalvador@chat.hackerbeach.org' });
    const message = new Message({
      content: 'Only 4 days until 2022!',
      id: 'hc-123abcde', replaceId: 'hc-234ghijk'
    });
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const mockSockethub = createMockSockethubService();
    const xmpp = this.owner.factoryFor('service:sockethub-xmpp').create({
      sockethub: mockSockethub,
      coms: comsService
    });
    const socketEmitSpy = sinon.spy(mockSockethub.client.socket, 'emit');

    const target = { id: channel.sockethubChannelId, type: 'room', name: channel.name };

    xmpp.transferMessage(target, message);

    const jobMessage = socketEmitSpy.getCall(0).args[1];
    assert.strictEqual(jobMessage.object.id, 'hc-123abcde', 'job object contains a message ID');
    assert.deepEqual(jobMessage.object['xmpp:replace'], { id: 'hc-234ghijk' }, 'job object contains the replace property');
  });

  test('#queryRoomInfo emits a room-info message', function (assert) {
    const channel = new Channel({ account: xmppAccount, name: 'elsalvador@chat.hackerbeach.org' });
    const coms = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const mockSockethub = createMockSockethubService();
    const xmpp = this.owner.factoryFor('service:sockethub-xmpp').create({
      sockethub: mockSockethub, coms
    });
    const socketEmitSpy = sinon.spy(mockSockethub.client.socket, 'emit');

    xmpp.queryRoomInfo(channel);

    assert.ok(socketEmitSpy.calledOnce, 'emits a sockethub job message');

    const jobMessage = socketEmitSpy.getCall(0).args[1];
    assert.strictEqual(jobMessage.type, 'room-info', 'job type is correct');
    assert.strictEqual(jobMessage.target.id, 'elsalvador@chat.hackerbeach.org', 'job target JID is correct');
    assert.strictEqual(jobMessage.target.type, 'room', 'job target type is correct');
  });
});
