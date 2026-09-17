import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { A } from '@ember/array';
import Service from '@ember/service';
import ChannelRoute from 'hyperchannel/routes/channel';
import Channel from 'hyperchannel/models/channel';
import { ircAccount } from '../../fixtures/accounts';

// Stubs the coms service so createChannelOrUserChannel's channelName argument
// can be captured without joining a real channel. Returns a real Channel
// instance so id/sockethubChannelId getters resolve.
class ComsStub extends Service {
  createChannelCalls = [];
  createChannel (account, channelName) {
    this.createChannelCalls.push({ account, channelName });
    return new Channel({ account, name: channelName });
  }
}

module('Unit | Route | channel', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:coms', ComsStub);
  });

  test('createChannelOrUserChannel reconstructs a single-hash IRC channel name', function (assert) {
    const route = new ChannelRoute();
    route.coms = this.owner.lookup('service:coms');

    // Slug for #kosmos-dev (single leading hash stripped) -> kosmos-dev@server
    const channel = route.createChannelOrUserChannel(ircAccount, 'kosmos-dev@irc.libera.chat');

    assert.strictEqual(route.coms.createChannelCalls.length, 1);
    assert.strictEqual(route.coms.createChannelCalls[0].channelName, '#kosmos-dev');
    assert.strictEqual(channel.name, '#kosmos-dev');
    assert.strictEqual(channel.id, '#kosmos-dev@irc.libera.chat');
    assert.strictEqual(channel.sockethubChannelId, '#kosmos-dev@irc.libera.chat');
  });

  test('createChannelOrUserChannel reconstructs a multi-hash IRC channel name', function (assert) {
    const route = new ChannelRoute();
    route.coms = this.owner.lookup('service:coms');

    // Slug for ##kosmos-dev (all hashes preserved) -> ##kosmos-dev@server
    const channel = route.createChannelOrUserChannel(ircAccount, '##kosmos-dev@irc.libera.chat');

    assert.strictEqual(route.coms.createChannelCalls.length, 1);
    assert.strictEqual(route.coms.createChannelCalls[0].channelName, '##kosmos-dev');
    assert.strictEqual(channel.name, '##kosmos-dev');
    assert.strictEqual(channel.id, '##kosmos-dev@irc.libera.chat');
    assert.strictEqual(channel.sockethubChannelId, '##kosmos-dev@irc.libera.chat');
  });

  test('model resolves the domain from the final @ in a multi-@ slug', function (assert) {
    const route = new ChannelRoute();
    route.coms = this.owner.lookup('service:coms');
    route.coms.channels = [ new Channel({ account: ircAccount, name: '#other' }) ];

    // Slug for #foo@bar -> foo@bar@irc.libera.chat
    const channel = route.model({ slug: 'foo@bar@irc.libera.chat' });

    assert.strictEqual(route.coms.createChannelCalls[0].channelName, '#foo@bar');
    assert.strictEqual(channel.id, '#foo@bar@irc.libera.chat');
  });

  test('model falls back to the first channel when the slug has no domain', function (assert) {
    const route = new ChannelRoute();
    route.coms = this.owner.lookup('service:coms');
    const firstChannel = new Channel({ account: ircAccount, name: '#first' });
    route.coms.channels = A([ firstChannel ]);

    let transitionedTo;
    route.router = {
      transitionTo (routeName, channel) { transitionedTo = { routeName, channel }; }
    };

    route.model({ slug: 'nodomain' });

    assert.strictEqual(transitionedTo.channel, firstChannel, 'transitions to the first channel');
  });
});
