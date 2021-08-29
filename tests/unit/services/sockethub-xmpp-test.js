import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
import { xmppAccount } from '../../fixtures/accounts';

module('Unit | Service | sockethub xmpp', function(hooks) {
  setupTest(hooks);

  test('#handlePresenceUpdate adds new users to the channel', function(assert) {
    const channel = new Channel({ account: xmppAccount, name: 'some-channel@kosmos.chat' });
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ], channels: [ channel ]
    });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsService });

    const presenceUpdate = {
      actor: { '@id': 'walter@kosmos.org', displayName: 'walter' },
      target: { '@id': 'some-channel@kosmos.chat', '@type': 'room' },
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
      actor: { '@id': 'walter@kosmos.org', displayName: 'walter' },
      target: { '@id': 'some-channel@kosmos.chat', '@type': 'room' },
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
        '@id': 'some_user@some-server.com/hyperchannel',
        '@type': 'person',
        displayName: 'some_user'
      },
      target: {
        '@id': 'some-channel@kosmos.chat',
        '@type': 'room',
        displayName: 'some-channel@kosmos.chat'
      },
      object: {
        '@type': 'message',
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
        '@id': 'some_user@some-server.com/hyperchannel',
        '@type': 'person',
        displayName: 'some_user'
      },
      target: {
        '@id': 'some-channel@kosmos.chat',
        '@type': 'room',
        displayName: 'some-channel@kosmos.chat'
      },
      object: {
        '@type': 'message',
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
      actor: { '@id': 'kosmos-dev@kosmos.chat/jimmy', '@type': 'person', displayName: 'jimmy' },
      target: { '@id': 'kosmos-dev@kosmos.chat', '@type': 'room' },
      object: { '@type': 'message', content: 'yo, gang!' }
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
});
