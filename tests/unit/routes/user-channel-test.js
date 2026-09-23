import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import { TrackedArray } from 'tracked-built-ins';
import UserChannelRoute from 'hyperchannel/routes/user_channel';
import Channel from 'hyperchannel/models/channel';
import UserChannel from 'hyperchannel/models/user_channel';
import { xmppAccount } from '../../fixtures/accounts';

class ComsStub extends Service {
  channels = new TrackedArray([]);
  createUserChannelCalls = [];

  createUserChannel (account, name) {
    this.createUserChannelCalls.push({ account, name });
    return new UserChannel({
      account,
      name,
      displayName: name.match(/\/(.+)$/)?.[1] ?? name,
      connected: true
    });
  }
}

module('Unit | Route | user channel', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:coms', ComsStub);
  });

  test('model opens a new XMPP DM from a room in the same domain', function (assert) {
    const route = new UserChannelRoute();
    route.coms = this.owner.lookup('service:coms');
    route.coms.channels = new TrackedArray([
      new Channel({ account: xmppAccount, name: 'kosmos-dev@kosmos.chat' })
    ]);
    const redirects = [];
    route.router = { transitionTo (...args) { redirects.push(args); } };

    const channel = route.model({ slug: 'kosmos-dev@kosmos.chat/alice' });

    assert.deepEqual(redirects, [], 'does not redirect');
    assert.strictEqual(route.coms.createUserChannelCalls.length, 1, 'creates a user channel');
    assert.strictEqual(route.coms.createUserChannelCalls[0].name, 'kosmos-dev@kosmos.chat/alice',
      'passes the slug with a literal slash to the service');
    assert.strictEqual(channel.name, 'kosmos-dev@kosmos.chat/alice');
    assert.strictEqual(channel.displayName, 'alice');
  });

  test('model reuses an existing user channel', function (assert) {
    const route = new UserChannelRoute();
    route.coms = this.owner.lookup('service:coms');
    const userChannel = new UserChannel({
      account: xmppAccount,
      name: 'kosmos-dev@kosmos.chat/alice'
    });
    route.coms.channels = new TrackedArray([ userChannel ]);

    assert.strictEqual(route.model({ slug: userChannel.slug }), userChannel);
  });

  test('model falls back to the first channel when the slug has no domain', function (assert) {
    const route = new UserChannelRoute();
    route.coms = this.owner.lookup('service:coms');
    const firstChannel = new Channel({ account: xmppAccount, name: 'kosmos-dev@kosmos.chat' });
    route.coms.channels = new TrackedArray([ firstChannel ]);

    let transitionedTo;
    route.router = {
      transitionTo (routeName, channel) { transitionedTo = { routeName, channel }; }
    };

    route.model({ slug: 'nodomain' });

    assert.strictEqual(transitionedTo.routeName, 'channel');
    assert.strictEqual(transitionedTo.channel, firstChannel, 'transitions to the first channel');
  });

  test('model redirects to welcome when there are no channels', function (assert) {
    const route = new UserChannelRoute();
    route.coms = this.owner.lookup('service:coms');
    route.coms.channels = new TrackedArray([]);

    let transitionedTo;
    route.router = {
      transitionTo (...args) { transitionedTo = args; }
    };

    route.model({ slug: 'nodomain' });

    assert.deepEqual(transitionedTo, ['welcome']);
  });
});
