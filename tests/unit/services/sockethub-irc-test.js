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

  // FIXME this test randomly fails with error "Assertion occured after test had finished."
  // test('#join sends the join activity to Sockethub for a room channel', function(assert) {
  //   const done = assert.async();
  //
  //   const sockethubStub = {
  //     ActivityStreams: {
  //       Object: Object
  //     },
  //     socket: {
  //       emit: function(type, event) {
  //         assert.equal(type, 'message');
  //         assert.equal(event['@type'], 'join');
  //         assert.equal(event.target, 'testchannel');
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
