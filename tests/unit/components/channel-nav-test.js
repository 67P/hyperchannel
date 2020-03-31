import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import Service from '@ember/service';
import Channel from 'hyperchannel/models/channel';
import Space from 'hyperchannel/models/space';
import createComponent from 'hyperchannel/tests/helpers/create-component';

const routerStub = Service.extend({
  foo: 'bar',

  transitionTo (route, space, channel) {
    this.currentRoute = route;
    this.currentSpace = space;
    this.currentChannel = channel;
    return true;
  }
});

module('Unit | Component | channel-nav', function (hooks) {
  setupTest(hooks);

  test('#activeChannel returns the currently active channel', function (assert) {
    const channel = new Channel({ sockethubChannelId: 'some-channel', visible: false });
    const channel2 = new Channel({ sockethubChannelId: 'some-other-channel', visible: true });
    const space = new Space();
    space.channels.pushObject(channel);
    space.channels.pushObject(channel2);

    const component = createComponent('component:channel-nav', { spaces: [space] });

    assert.equal(component.activeChannel, channel2);
  });

  test('switching to next channel', function (assert) {
    const space = new Space();
    const channel1 = new Channel({ sockethubChannelId: 'channel1', name: 'channel1', visible: false, space });
    const channel2 = new Channel({ sockethubChannelId: 'channel2', name: 'channel2', visible: true, space });
    const channel3 = new Channel({ sockethubChannelId: 'channel3', name: 'channel3', visible: false, space });
    space.channels = [channel2, channel1, channel3];

    const routerService = routerStub.create();
    const component = createComponent('component:channel-nav', { spaces: [space] });
    component.router = routerService;

    run(() => component.goNextChannel());

    assert.equal(routerService.currentRoute, 'space.channel');
    assert.equal(routerService.currentSpace, space);
    assert.equal(routerService.currentChannel.name, channel3.name);

    channel2.visible = false;
    channel3.visible = true;
    run(() => component.goNextChannel());

    assert.equal(routerService.currentChannel.name, channel1.name);
  });

  test('switching to previous channel', function (assert) {
    const space = new Space();
    const channel1 = new Channel({ sockethubChannelId: 'channel1', name: 'channel1', visible: false, space });
    const channel2 = new Channel({ sockethubChannelId: 'channel2', name: 'channel2', visible: true, space });
    const channel3 = new Channel({ sockethubChannelId: 'channel3', name: 'channel3', visible: false, space });
    space.channels = [channel1, channel3, channel2];

    const routerService = routerStub.create();
    const component = createComponent('component:channel-nav', { spaces: [space] });
    component.router = routerService;

    run(() => component.goPreviousChannel());

    assert.equal(routerService.currentRoute, 'space.channel');
    assert.equal(routerService.currentSpace, space);
    assert.equal(routerService.currentChannel.name, channel1.name);

    channel1.visible = true;
    channel2.visible = false;
    run(() => component.goPreviousChannel());

    assert.equal(routerService.currentChannel.name, channel3.name);
  });

});
