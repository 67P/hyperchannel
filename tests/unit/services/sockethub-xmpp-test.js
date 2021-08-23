import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';
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

  test('#getChannelForMessage returns the channel for a given message', function(assert) {
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

    assert.equal(service.getChannelForMessage(message), channel);
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
});
