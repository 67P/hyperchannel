import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import Channel from 'hyperchannel/models/channel';
import { ircAccount, xmppAccount } from '../../fixtures/accounts';

module('Unit | Service | coms', function(hooks) {
  setupTest(hooks);

  test('#connectServer calls connect on the appropriate transport service', function(assert) {
    const ircStub = { connect: function() {} };
    const connectStub = sinon.stub(ircStub, 'connect');
    const service = this.owner.factoryFor('service:coms').create({ irc: ircStub });

    service.connectServer(ircAccount);

    assert.ok(connectStub.calledOnce);
    assert.ok(connectStub.calledWith(ircAccount));
  });

  test('#joinChannel calls join on the appropriate transport service', function(assert) {
    const xmppStub = { join: function() {} };
    const joinStub = sinon.stub(xmppStub, 'join');
    const service = this.owner.factoryFor('service:coms').create({ xmpp: xmppStub });

    const channel = new Channel({
      account: xmppAccount,
      name: 'kosmos-random@kosmos.chat'
    });

    service.joinChannel(channel, 'room');

    assert.ok(joinStub.calledOnce);
    assert.ok(joinStub.calledWith(channel, 'room'));
  });

  test('#transferMessage calls transferMessage on the appropriate transport service', function(assert) {
    const xmppStub = {
      transferMessage: function(target, content, id) {
        assert.equal(target.id, 'testchannel@kosmos.chat');
        assert.equal(target.type, 'room');
        assert.equal(target.name, 'testchannel@kosmos.chat');
        assert.equal(content, 'hello world');
        assert.equal(id, 'hc-1234abcd');
      }
    };
    const service = this.owner.factoryFor('service:coms').create({ xmpp: xmppStub });

    const channel = new Channel({
      account: xmppAccount,
      name: 'testchannel@kosmos.chat'
    });

    service.transferMessage(channel, 'hello world', 'hc-1234abcd');
  });

  test('#updateChannelUserList updates the users and connects the channel', function(assert) {
    const observeMessage = {
      "type": "observe",
      "actor": {
          "id": "kosmos@kosmos.chat",
          "type": "room",
          "name": "kosmos"
      },
      "target": {
        "id": "jimmy@kosmos.org/hyperchannel",
        "type": "person"
      },
      "context": "xmpp",
      "object": {
          "type": "attendance",
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

    const channel = new Channel({
      account: xmppAccount,
      name: 'kosmos@kosmos.chat',
      connected: false
    });

    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ],
      channels: [ channel ]
    });

    service.updateChannelUserList(observeMessage);

    assert.ok(channel.connected);
    assert.equal(channel.userList.length, 5);
  });

  test('#sortedChannels returns channels sorted by name', function(assert) {
    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount ]
    });

    ['dominica', 'phu quoc', 'lamu', 'canoa', 'flores'].forEach(cn => {
      service.channels.pushObject(new Channel({ account: ircAccount, name: cn }));
    })

    assert.deepEqual(service.sortedChannels.mapBy('name'),
                     [ 'canoa', 'dominica', 'flores', 'lamu', 'phu quoc' ]);
  });

  test('#channelDomains returns unique domains of all channels', function(assert) {
    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount, xmppAccount ]
    });
    service.channels.pushObject(new Channel({ account: ircAccount, name: 'kosmos' }));
    service.channels.pushObject(new Channel({ account: ircAccount, name: 'kosmos-random' }));
    service.channels.pushObject(new Channel({ account: xmppAccount, name: 'kosmos@kosmos.chat' }));
    service.channels.pushObject(new Channel({ account: xmppAccount, name: 'chat@dino.im' }));

    assert.deepEqual(service.channelDomains, ['dino.im', 'irc.libera.chat', 'kosmos.chat']);
  });

  test('#groupedChannelsByDomain returns channels grouped by domain', function(assert) {
    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount, xmppAccount ]
    });
    service.channels.pushObject(new Channel({ account: ircAccount, name: 'kosmos' }));
    service.channels.pushObject(new Channel({ account: ircAccount, name: 'kosmos-random' }));
    service.channels.pushObject(new Channel({ account: xmppAccount, name: 'kosmos@kosmos.chat' }));
    service.channels.pushObject(new Channel({ account: xmppAccount, name: 'chat@dino.im' }));

    const channels = service.groupedChannelsByDomain;

    assert.deepEqual(channels[0].domain, 'dino.im');
    assert.deepEqual(channels[0].channels.length, 1);
    assert.deepEqual(channels[1].domain, 'irc.libera.chat');
    assert.deepEqual(channels[1].channels.length, 2);
    assert.deepEqual(channels[2].domain, 'kosmos.chat');
    assert.deepEqual(channels[2].channels.length, 1);
    assert.deepEqual(channels[2].channels[0].name, 'kosmos@kosmos.chat');
  });

  test('#activeChannel returns the currently active channel', function (assert) {
    const channel1 = new Channel({ account: ircAccount, name: 'kosmos', visible: false });
    const channel2 = new Channel({ account: xmppAccount, name: 'chat@dino.im', visible: true });
    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount, xmppAccount ],
      channels: [ channel1, channel2 ]
    });

    assert.equal(service.activeChannel, channel2);
  });


  // TODO Re-implement without custom space IDs
  //
  // test('#loggedChannels returns list of channels when space is Freenode', function(assert) {
  //   const space = new Space({ name: 'Freenode' });
  //
  //   let loggedChannels = space.loggedChannels;
  //
  //   assert.ok(loggedChannels.length > 0);
  //   assert.ok(loggedChannels.find(function(name) { return name === '#kosmos'; }));
  // });
  //
  // test('#loggedChannels returns empty list when space is not Freenode', function(assert) {
  //   const space = new Space({ name: 'Quakenet' });
  //
  //   assert.equal(space.loggedChannels.length, 0);
  // });
});
