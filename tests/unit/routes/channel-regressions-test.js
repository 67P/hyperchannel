import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { A } from '@ember/array';
import ChannelRoute from 'hyperchannel/routes/channel';
import Channel from 'hyperchannel/models/channel';
import { ircAccount } from '../../fixtures/accounts';

module('Unit | Route | channel regressions', function (hooks) {
  setupTest(hooks);

  function recognizeChannel (router, url) {
    let recognized = router.recognize(url);
    while (recognized && recognized.name !== 'channel') {
      recognized = recognized.parent;
    }
    return recognized;
  }

  function createRoute (channels) {
    const route = new ChannelRoute();
    route.coms = {
      channels: A(channels),
      createChannel (account, name) {
        return new Channel({ account, name });
      }
    };
    return route;
  }

  test('a literal percent channel survives an Ember URL round trip', function (assert) {
    const channel = new Channel({ account: ircAccount, name: '#100%' });
    const router = this.owner.lookup('service:router');
    const recognized = recognizeChannel(router, '/channel/100%25@irc.libera.chat');

    assert.strictEqual(recognized.params.slug, channel.slug, 'Ember already decoded the percent');
    const route = createRoute([channel]);
    assert.strictEqual(route.model(recognized.params), channel, 'reopens the existing channel without throwing');
  });

  test('a percent escape in a channel name is not decoded a second time', function (assert) {
    const channel = new Channel({ account: ircAccount, name: '#foo%23bar' });
    const router = this.owner.lookup('service:router');
    const recognized = recognizeChannel(router, '/channel/foo%2523bar@irc.libera.chat');

    assert.strictEqual(recognized.params.slug, channel.slug, 'Ember preserves the literal percent escape');
    const route = createRoute([channel]);
    const resolved = route.model(recognized.params);
    assert.strictEqual(resolved.name, '#foo%23bar', 'does not join #foo#bar instead');
    assert.strictEqual(resolved, channel, 'reuses the existing channel');
  });

  test('an IRC channel containing a slash keeps its sidebar domain', function (assert) {
    const channel = new Channel({ account: ircAccount, name: '#foo/bar' });

    assert.strictEqual(channel.domain, 'irc.libera.chat', 'slash belongs to the IRC name, not an XMPP resource');
  });

  test('a deep link can open an unloaded IRC channel containing a slash', function (assert) {
    const existing = new Channel({ account: ircAccount, name: '#general' });
    const route = createRoute([existing]);
    const router = this.owner.lookup('service:router');
    const recognized = recognizeChannel(router, '/channel/foo%2Fbar@irc.libera.chat');
    const redirects = [];
    route.router = { transitionTo (...args) { redirects.push(args); } };

    const resolved = route.model(recognized.params);

    assert.deepEqual(redirects, [], 'does not redirect to the first channel');
    assert.strictEqual(resolved?.name, '#foo/bar', 'opens the requested channel');
    assert.strictEqual(resolved?.account, ircAccount, 'uses the matching IRC account');
  });
});
