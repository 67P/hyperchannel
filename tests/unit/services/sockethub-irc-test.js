import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';
import { ircAccount, xmppAccount } from '../../fixtures/accounts';

module('Unit | Service | sockethub irc', function (hooks) {
  setupTest(hooks);

  test('#join directly connects a person channel', function (assert) {
    const service = this.owner.lookup('service:sockethub-irc');
    const channel = new Channel({ account: ircAccount, isUserChannel: true });

    service.join(channel, 'person');

    assert.ok(channel.connected);
  });

  test('#handlePresenceUpdate extracts hostname from the name@host ID format and adds the user', function (assert) {
    const channel = new Channel({
      account: ircAccount,
      name: '##kosmos-dev'
    });
    const service = this.owner.lookup('service:sockethub-irc');
    service.coms = {
      channels: [channel],
      accounts: [ircAccount]
    };

    service.handlePresenceUpdate({
      target: { id: '##kosmos-dev@irc.libera.chat', type: 'room' },
      actor: { id: 'newuser@irc.libera.chat', name: 'newuser' }
    });

    assert.ok(channel.connected, 'marks the channel connected');
    assert.ok(channel.userList.includes('newuser'), 'adds the incoming user');
    assert.ok(channel.userList.includes(ircAccount.nickname), 'adds the own nickname');
  });

  test('#handlePresenceUpdate parses the hostname from the final @ in the room ID', function (assert) {
    const channel = new Channel({
      account: ircAccount,
      name: '#foo@bar'
    });
    const service = this.owner.lookup('service:sockethub-irc');
    service.coms = {
      channels: [channel],
      accounts: [ircAccount]
    };

    service.handlePresenceUpdate({
      target: { id: '#foo@bar@irc.libera.chat', type: 'room' },
      actor: { id: 'newuser@irc.libera.chat', name: 'newuser' }
    });

    assert.ok(channel.connected, 'marks the channel connected');
    assert.ok(channel.userList.includes('newuser'), 'adds the incoming user');
  });

  test('#addMessageToChannel finds the IRC account when other accounts have no server', function (assert) {
    const service = this.owner.lookup('service:sockethub-irc');
    const channel = new Channel({ account: ircAccount, name: 'raucao' });
    service.coms = {
      channels: [channel],
      accounts: [xmppAccount, ircAccount]
    };

    service.addMessageToChannel({
      type: 'send',
      actor: { type: 'person', id: 'raucao@irc.libera.chat', name: 'raucao' },
      object: { type: 'message', content: 'hey' },
      target: { type: 'person', id: 'jimmy@irc.libera.chat', name: 'jimmy' },
      published: '2026-09-23T13:19:20.900Z'
    });

    const messages = channel.messages.filter(m => m.type === 'message-chat');

    assert.strictEqual(messages.length, 1, 'adds the direct message to the user channel');
    assert.strictEqual(messages[0].content, 'hey');
    assert.strictEqual(messages[0].nickname, 'raucao');
  });

  test('#leave sends a leave activity without an empty object', function (assert) {
    const service = this.owner.lookup('service:sockethub-irc');
    let emitted;
    service.sockethub = {
      contextFor: () => ['context'],
      client: { socket: { emit (event, message) { emitted = { event, message }; } } }
    };

    const channel = new Channel({ account: ircAccount, name: '#kosmos' });
    service.leave(channel);

    assert.strictEqual(emitted.event, 'message');
    assert.strictEqual(emitted.message.type, 'leave');
    assert.strictEqual(emitted.message.target.id, channel.sockethubChannelId);
    assert.strictEqual(emitted.message.target.type, 'room');
    assert.notOk('object' in emitted.message, 'omits the invalid empty object');
  });

  // FIXME this test randomly fails with error "Assertion occured after test had finished."
  // skip('#join sends the join activity to Sockethub for a room channel', function(assert) {
  //   const done = assert.async();
  //
  //   const sockethubStub = {
  //     ActivityStreams: {
  //       Object: Object
  //     },
  //     socket: {
  //       emit: function(type, event) {
  //         assert.strictEqual(type, 'message');
  //         assert.strictEqual(event['@type'], 'join');
  //         assert.strictEqual(event.target, 'testchannel');
  //         done();
  //       }
  //     }
  //   };
  //
  //   const service = this.subject({ sockethub: sockethubStub });
  //   const space = new Space();
  //   const channel = new Channel({ sockethubChannelId: 'testchannel' });
  //
  //   service.join(space, channel, 'room');
  // });
});
