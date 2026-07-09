import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';
import { ircAccount } from '../../fixtures/accounts';

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
