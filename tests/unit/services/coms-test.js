import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
import { ircAccount, xmppAccount } from '../../fixtures/accounts';

function jsonResponse (body) {
  return Promise.resolve({ json: () => Promise.resolve(body) });
}

function archivePage (messages, previous) {
  return { today: { messages, previous } };
}

function archiveMessage (id, from = 'alice', text = `message ${id}`) {
  return { id, from, text, timestamp: '2024-01-05T00:00:00.000Z' };
}

module('Unit | Service | coms', function (hooks) {
  setupTest(hooks);

  hooks.afterEach(function () {
    sinon.restore();
  });

  test('#connectServer calls connect on the appropriate transport service', function (assert) {
    const ircStub = { connect: function () {} };
    const connectStub = sinon.stub(ircStub, 'connect');
    const service = this.owner.factoryFor('service:coms').create({ irc: ircStub });

    service.connectServer(ircAccount);

    assert.ok(connectStub.calledOnce);
    assert.ok(connectStub.calledWith(ircAccount));
  });

  test('#joinChannel calls join on the appropriate transport service', function (assert) {
    const xmppStub = { join: function () {} };
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

  test('#transferMessage calls transferMessage on the appropriate transport service', function (assert) {
    assert.expect(4);
    
    const msg = new Message({
      content: 'hello world',
      id: 'hc-1234abcd'
    });
    const xmppStub = {
      transferMessage: function (target, message) {
        assert.strictEqual(target.id, 'testchannel@kosmos.chat');
        assert.strictEqual(target.type, 'room');
        assert.strictEqual(target.name, 'testchannel@kosmos.chat');
        assert.strictEqual(message, msg);
      }
    };
    const service = this.owner.factoryFor('service:coms').create({ xmpp: xmppStub });

    const channel = new Channel({
      account: xmppAccount,
      name: 'testchannel@kosmos.chat'
    });

    service.transferMessage(channel, msg);
  });

  test('#updateChannelUserList updates the users and connects the channel', function (assert) {
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
    assert.strictEqual(channel.userList.length, 5);
  });

  test('#updateChannelTopic sets the channel topic from the object content', function (assert) {
    const channel = new Channel({
      account: ircAccount,
      name: '#kosmos'
    });

    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount ],
      channels: [ channel ]
    });

    service.updateChannelTopic({
      type: 'update',
      actor: { type: 'person', id: 'raucao@irc.libera.chat', name: 'raucao' },
      target: { type: 'room', id: '#kosmos@irc.libera.chat', name: '#kosmos' },
      object: { type: 'topic', content: 'Fixing IRC topics' }
    });

    assert.strictEqual(channel.topic, 'Fixing IRC topics');
    assert.strictEqual(channel.formattedTopic.toString(), 'Fixing IRC topics');
  });

  test('#sortedChannels returns channels sorted by name', function (assert) {
    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount ]
    });

    ['dominica', 'phu quoc', 'lamu', 'canoa', 'flores'].forEach(cn => {
      service.channels.push(new Channel({ account: ircAccount, name: cn }));
    })

    assert.deepEqual(service.sortedChannels.map(ch => ch.name),
                     [ 'canoa', 'dominica', 'flores', 'lamu', 'phu quoc' ]);
  });

  test('#channelDomains returns unique domains of all channels', function (assert) {
    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount, xmppAccount ]
    });
    service.channels.push(new Channel({ account: ircAccount, name: 'kosmos' }));
    service.channels.push(new Channel({ account: ircAccount, name: 'kosmos-random' }));
    service.channels.push(new Channel({ account: xmppAccount, name: 'kosmos@kosmos.chat' }));
    service.channels.push(new Channel({ account: xmppAccount, name: 'chat@dino.im' }));

    assert.deepEqual(service.channelDomains, ['dino.im', 'irc.libera.chat', 'kosmos.chat']);
  });

  test('#groupedChannelsByDomain returns channels grouped by domain', function (assert) {
    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount, xmppAccount ]
    });
    service.channels.push(new Channel({ account: ircAccount, name: 'kosmos' }));
    service.channels.push(new Channel({ account: ircAccount, name: 'kosmos-random' }));
    service.channels.push(new Channel({ account: xmppAccount, name: 'kosmos@kosmos.chat' }));
    service.channels.push(new Channel({ account: xmppAccount, name: 'chat@dino.im' }));

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

    assert.strictEqual(service.activeChannel, channel2);
  });

  test('#updateChannelRoomInfo updates all standard and extended room info on the channel', function (assert) {
    const channel = new Channel({
      account: xmppAccount,
      name: 'kosmos@kosmos.chat',
      displayName: 'kosmos@kosmos.chat',
      connected: false
    });

    const service = this.owner.factoryFor('service:coms').create({
      accounts: [ xmppAccount ],
      channels: [ channel ]
    });

    const roomInfoMessage = {
      type: 'query',
      actor: {
        id: 'kosmos@kosmos.chat',
        type: 'room',
        name: 'Kosmos Development Room'
      },
      object: {
        type: 'room-info',
        features: [
          'http://jabber.org/protocol/muc',
          'muc_persistent'
        ],
        identities: [
          {
            category: 'conference',
            type: 'text',
            name: 'Kosmos Development Room'
          }
        ],
        roominfo: {
          description: {
            type: 'text-single',
            label: 'Room description',
            value: 'The main development room.'
          },
          occupants: {
            type: 'text-single',
            label: 'Number of occupants',
            value: 12
          }
        },
        roomconfig: {
          changesubject: {
            type: 'boolean',
            label: 'Occupants May Change the Subject',
            value: true
          }
        }
      }
    };

    service.updateChannelRoomInfo(roomInfoMessage);

    assert.ok(channel.connected);
    assert.ok(channel.roomInfoLoaded);
    assert.strictEqual(channel.displayName, 'Kosmos Development Room');
    assert.strictEqual(channel.description, 'The main development room.');
    assert.deepEqual([...channel.roomFeatures], ['http://jabber.org/protocol/muc', 'muc_persistent']);
    assert.strictEqual(channel.roomInfoData.occupants.value, 12);
    assert.strictEqual(channel.roomConfigData.changesubject.value, true);
  });

  test('#loadOlderMessages returns an empty result when there is no cursor', async function (assert) {
    const channel = new Channel({ account: ircAccount, name: '#kosmos' });
    const service = this.owner.factoryFor('service:coms').create();

    const result = await service.loadOlderMessages(channel);

    assert.deepEqual(result, { added: 0, hasMore: false }, 'reports nothing to add');
    assert.false(channel.hasOlderMessages, 'leaves hasOlderMessages false');
  });

  test('#loadOlderMessages loads a page, filters duplicates, and advances the cursor', async function (assert) {
    const channel = new Channel({ account: ircAccount, name: '#kosmos' });
    channel.searchedPreviousLogsUntilDate = '2024-01-05';

    // Pre-existing message that the archive page will deliver again.
    channel.addMessage(new Message({
      type: 'message-chat', date: new Date(), nickname: 'alice',
      content: 'message dup', id: 'dup'
    }));

    const messages = [
      archiveMessage('dup', 'alice', 'message dup'),
      ...Array.from({ length: 30 }, (_, i) => archiveMessage(`m${i}`))
    ];

    const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(url => {
      assert.true(url.endsWith('/2024-01-05'), `requests the cursor date (${url})`);
      return jsonResponse(archivePage(messages, '2024-01-04'));
    });

    const service = this.owner.factoryFor('service:coms').create();
    const result = await service.loadOlderMessages(channel);

    assert.true(fetchStub.calledOnce, 'fetches a single page once it has enough messages');
    assert.strictEqual(result.added, 30, 'counts only the newly added messages');
    assert.true(result.hasMore, 'reports that more history is available');
    assert.strictEqual(channel.searchedPreviousLogsUntilDate, '2024-01-04', 'advances the cursor');
    assert.true(channel.hasOlderMessages, 'updates hasOlderMessages');
  });

  test('#loadOlderMessages follows the cursor across pages until history is exhausted', async function (assert) {
    const channel = new Channel({ account: ircAccount, name: '#kosmos' });
    channel.searchedPreviousLogsUntilDate = '2024-01-05';

    const firstPage = Array.from({ length: 2 }, (_, i) => archiveMessage(`first${i}`));
    const secondPage = Array.from({ length: 30 }, (_, i) => archiveMessage(`second${i}`));

    const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(url => {
      if (url.endsWith('/2024-01-05')) return jsonResponse(archivePage(firstPage, '2024-01-04'));
      if (url.endsWith('/2024-01-04')) return jsonResponse(archivePage(secondPage, null));
      throw new Error(`unexpected URL ${url}`);
    });

    const service = this.owner.factoryFor('service:coms').create();
    const result = await service.loadOlderMessages(channel);

    assert.strictEqual(fetchStub.callCount, 2, 'fetches the next page using the previous cursor');
    assert.strictEqual(result.added, 32, 'adds messages from both pages');
    assert.false(result.hasMore, 'reports exhaustion once there is no previous cursor');
    assert.false(channel.hasOlderMessages, 'clears hasOlderMessages at the end of history');
  });
});
