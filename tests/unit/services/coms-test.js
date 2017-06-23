import { moduleFor } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';

moduleFor('service:coms', 'Unit | Service | coms', {
  // Specify the other units that are required for this test.
  needs: ['service:ajax', 'service:logger', 'service:remotestorage',
          'service:sockethub-irc', 'service:sockethub-xmpp']
});

test('#connectServer calls connect on the appropriate transport service', function(assert) {
  const ircStub = {
    connect: function() { }
  };
  const connectStub = this.stub(ircStub, 'connect');
  const service = this.subject({ irc: ircStub });

  const space = Space.create({ protocol: 'IRC' });

  service.connectServer(space);

  assert.ok(connectStub.calledOnce);
  assert.ok(connectStub.calledWith(space));
});

test('#joinChannel calls join on the appropriate transport service', function(assert) {
  const xmppStub = {
    join: function() { }
  };
  const joinStub = this.stub(xmppStub, 'join');
  const service = this.subject({ xmpp: xmppStub });

  const space = Space.create({ protocol: 'XMPP' });
  const channel = Channel.create({});

  service.joinChannel(space, channel, 'room');

  assert.ok(joinStub.calledOnce);
  assert.ok(joinStub.calledWith(space, channel, 'room'));
});

test('#transferMessage calls transferMessage on the appropriate transport service', function(assert) {
  const xmppStub = {
    transferMessage: function(space, target, content) {
      assert.equal(space.get('name'), 'Testspace');
      assert.equal(target['@id'], 'testspace-testchannel');
      assert.equal(target['@type'], 'room');
      assert.equal(target.displayName, 'testchannel');
      assert.equal(content, 'hello world');
    }
  };

  const service = this.subject({ xmpp: xmppStub });

  const space = Space.create({ protocol: 'XMPP', name: 'Testspace' });
  const channel = Channel.create({
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
        "@id": "irc://irc.freenode.net/#kosmos",
        "@type": "room",
        "displayName": "#kosmos"
    },
    "context": "irc",
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

  const space = Space.create({
    protocol: 'IRC',
    name: 'Freenode',
    server: { hostname: 'irc.freenode.net' }
  });
  const channel = Channel.create({
    name: '#kosmos',
    sockethubChannelId: 'irc://irc.freenode.net/#kosmos',
    space: space,
    connected: false
  });

  space.get('channels').pushObject(channel);

  const service = this.subject({ spaces: [space] });

  service.updateChannelUserList(observeMessage);

  assert.ok(channel.get('connected'));
  assert.equal(channel.get('userList').length, 5);
});
