import { module } from 'qunit';
import { setupTest } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';

module('Unit | Service | coms', function(hooks) {
  setupTest(hooks);

  test('#connectServer calls connect on the appropriate transport service', function(assert) {
    const ircStub = {
      connect: function() { }
    };
    const connectStub = this.stub(ircStub, 'connect');
    const service = this.owner.factoryFor('service:coms').create({ irc: ircStub });

    const space = new Space();
    space.protocol = 'IRC';
    service.connectServer(space);

    assert.ok(connectStub.calledOnce);
    assert.ok(connectStub.calledWith(space));
  });

  test('#joinChannel calls join on the appropriate transport service', function(assert) {
    const xmppStub = {
      join: function() { }
    };
    const joinStub = this.stub(xmppStub, 'join');
    const service = this.owner.factoryFor('service:coms').create({ xmpp: xmppStub });

    const space = new Space();
    space.protocol = 'XMPP';
    const channel = new Channel();

    service.joinChannel(space, channel, 'room');

    assert.ok(joinStub.calledOnce);
    assert.ok(joinStub.calledWith(space, channel, 'room'));
  });

  test('#transferMessage calls transferMessage on the appropriate transport service', function(assert) {
    const xmppStub = {
      transferMessage: function(space, target, content) {
        assert.equal(space.name, 'Testspace');
        assert.equal(target['@id'], 'testspace-testchannel');
        assert.equal(target['@type'], 'room');
        assert.equal(target.displayName, 'testchannel');
        assert.equal(content, 'hello world');
      }
    };

    const service = this.owner.factoryFor('service:coms').create({ xmpp: xmppStub });

    const space = new Space({ protocol: 'XMPP', name: 'Testspace' });
    const channel = new Channel({
      name: 'testchannel',
      sockethubChannelId: 'testspace-testchannel',
      isUserChannel: false
    });

    service.transferMessage(space, channel, 'hello world');
  });

  test('#updateChannelUserList updates the users and connects the channel', function(assert) {
    const observeMessage = {
      "@type": "observe",
      "actor": {
          "@id": "kosmos@kosmos.chat",
          "@type": "room",
          "displayName": "kosmos"
      },
      "target": {
        "@id": "galfert@kosmos.org/hyperchannel",
        "@type": "person"
      },
      "context": "xmpp",
      "object": {
          "@type": "attendance",
          "members": [
              "derbumi",
              "galfert",
              "gregkare",
              "raucao",
              "slvrbckt"
          ]
      },
      "published": "2017-06-23T15:44:54.383Z"
    };

    const space = new Space({
      protocol: 'XMPP',
      name: 'Kosmos',
      server: { hostname: 'xmpp.kosmos.org', username: 'galfert@kosmos.org' }
    });
    const channel = new Channel({
      name: 'kosmos',
      sockethubChannelId: 'kosmos@kosmos.chat',
      space: space,
      connected: false
    });

    space.channels.pushObject(channel);

    const service = this.owner.factoryFor('service:coms').create({ spaces: [space] });

    service.updateChannelUserList(observeMessage);

    assert.ok(channel.connected);
    assert.equal(channel.userList.length, 5);
  });
});
