import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import Channel from 'hyperchannel/models/channel';
import Space from 'hyperchannel/models/space';
import { run } from '@ember/runloop';

const routerStub = Service.extend({
  transitionTo (route, space, channel) {
    this.set('currentRoute', route);
    this.set('currentSpace', space);
    this.set('currentChannel', channel);

    return true;
  }
});

module('Unit | Component | channel-nav', function (hooks) {
  setupTest(hooks);

  test('#activeChannel returns the currently active channel', function (assert) {
    const channel = Channel.create({ sockethubChannelId: 'some-channel', visible: false });
    const channel2 = Channel.create({ sockethubChannelId: 'some-other-channel', visible: true });
    const space = Space.create();
    space.channels.pushObject(channel);
    space.channels.pushObject(channel2);

    const component = this.owner.factoryFor('component:channel-nav').create({ spaces: [space] });

    assert.equal(component.activeChannel, channel2);
  });

  test('switching to next channel', function (assert) {
    const space = Space.create();
    const channel1 = Channel.create({ sockethubChannelId: 'channel1', name: 'channel1', visible: false, space });
    const channel2 = Channel.create({ sockethubChannelId: 'channel2', name: 'channel2', visible: true, space });
    const channel3 = Channel.create({ sockethubChannelId: 'channel3', name: 'channel3', visible: false, space });
    space.set('channels', [channel2, channel1, channel3]);

    const routerService = routerStub.create();

    const component = this.owner.factoryFor('component:channel-nav').create({
      router: routerService,
      spaces: [space]
    });

    run(() => component.send('goNextChannel'));

    assert.equal(routerService.currentRoute, 'space.channel');
    assert.equal(routerService.currentSpace, space);
    assert.equal(routerService.currentChannel.name, channel3.name);

    channel2.set('visible', false);
    channel3.set('visible', true);
    run(() => component.send('goNextChannel'));

    assert.equal(routerService.currentChannel.name, channel1.name);
  });

  test('switching to previous channel', function (assert) {
    const space = Space.create();
    const channel1 = Channel.create({ sockethubChannelId: 'channel1', name: 'channel1', visible: false, space });
    const channel2 = Channel.create({ sockethubChannelId: 'channel2', name: 'channel2', visible: true, space });
    const channel3 = Channel.create({ sockethubChannelId: 'channel3', name: 'channel3', visible: false, space });
    space.set('channels', [channel1, channel3, channel2]);

    const routerService = routerStub.create();

    const component = this.owner.factoryFor('component:channel-nav').create({
      router: routerService,
      spaces: [space]
    });

    run(() => component.send('goPreviousChannel'));

    assert.equal(routerService.currentRoute, 'space.channel');
    assert.equal(routerService.currentSpace, space);
    assert.equal(routerService.currentChannel.name, channel1.name);

    channel1.set('visible', true);
    channel2.set('visible', false);
    run(() => component.send('goPreviousChannel'));

    assert.equal(routerService.currentChannel.name, channel3.name);
  });

});
