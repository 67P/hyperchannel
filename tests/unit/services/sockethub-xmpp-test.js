import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';

module('Unit | Service | sockethub xmpp', function(hooks) {
  setupTest(hooks);

  test('#handlePresenceUpdate adds new users to the channel', function(assert) {
    const channel = Channel.create({ sockethubChannelId: 'some-channel' });
    const space = Space.create();
    const comsStub = Service.create({ spaces: [space] });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsStub });

    space.get('channels').pushObject(channel);

    const presenceUpdate = {
      actor: {
        displayName: 'new_user'
      },
      target: {
        '@id': 'some-channel',
        '@type': 'room'
      },
      object: {
        presence: 'online'
      }
    };

    service.handlePresenceUpdate(presenceUpdate);

    assert.ok(channel.get('userList').includes('new_user'));
  });

  test('#handlePresenceUpdate removes offline users from the channel', function(assert) {
    const channel = Channel.create({ sockethubChannelId: 'some-channel' });
    const space = Space.create();
    const comsStub = Service.create({ spaces: [space] });

    channel.addUser('some_user');
    space.get('channels').pushObject(channel);

    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsStub });

    const presenceUpdate = {
      actor: {
        displayName: 'some_user'
      },
      target: {
        '@id': 'some-channel',
        '@type': 'room'
      },
      object: {
        presence: 'offline'
      }
    };

    service.handlePresenceUpdate(presenceUpdate);

    assert.notOk(channel.get('userList').includes('some_user'));
  });

  test('#generateChannelId returns a Sockethub channel ID', function(assert) {
    const service = this.owner.lookup('service:sockethub-xmpp');
    const space = Space.create();

    assert.equal(service.generateChannelId(space, 'random-channel'), 'random-channel');
  });

  test('#getSpaceForMessage returns the space for a given message', function(assert) {
    const space = Space.create();
    const channel = Channel.create({ sockethubChannelId: 'some-channel@some-server.com' });
    const comsStub = Service.create({ spaces: [space] });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsStub });

    space.get('channels').pushObject(channel);

    const message = {
      actor: {
        '@id': 'some_user@some-server.com/hyperchannel',
        '@type': 'person',
        displayName: 'some_user'
      },
      target: {
        '@id': 'some-channel@some-server.com',
        '@type': 'room',
        displayName: 'some-channel@some-server.com'
      },
      object: {
        '@type': 'message',
        content: 'hello world'
      }
    };

    assert.equal(service.getSpaceForMessage(message), space);
  });

  test('#getChannelForMessage returns the channel for a given message', function(assert) {
    const space = Space.create();
    const channel = Channel.create({ sockethubChannelId: 'some-channel@some-server.com' });
    const comsStub = Service.create({ spaces: [space] });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsStub });

    space.get('channels').pushObject(channel);

    const message = {
      actor: {
        '@id': 'some_user@some-server.com/hyperchannel',
        '@type': 'person',
        displayName: 'some_user'
      },
      target: {
        '@id': 'some-channel@some-server.com',
        '@type': 'room',
        displayName: 'some-channel@some-server.com'
      },
      object: {
        '@type': 'message',
        content: 'hello world'
      }
    };

    assert.equal(service.getChannelForMessage(space, message), channel);
  });

  test('#addMessageToChannel adds the message to the channel', function(assert) {
    const space = Space.create();
    const channel = Channel.create({ sockethubChannelId: 'some-channel@some-server.com' });
    const comsStub = Service.create({ spaces: [space] });
    const service = this.owner.factoryFor('service:sockethub-xmpp').create({ coms: comsStub });

    space.get('channels').pushObject(channel);

    const message = {
      actor: {
        '@id': 'some_user@some-server.com/hyperchannel',
        '@type': 'person',
        displayName: 'some_user'
      },
      target: {
        '@id': 'some-channel@some-server.com',
        '@type': 'room',
        displayName: 'some-channel@some-server.com'
      },
      object: {
        '@type': 'message',
        content: 'hello world'
      }
    };

    service.addMessageToChannel(message);

    assert.equal(channel.get('messages.lastObject.content'), 'hello world');
  });
});
