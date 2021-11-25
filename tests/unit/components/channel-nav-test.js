import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import Service from '@ember/service';
import Channel from 'hyperchannel/models/channel';
import createComponent from 'hyperchannel/tests/helpers/create-component';
import { ircAccount } from '../../fixtures/accounts';

class RouterStub extends Service {
  transitionTo (route, channel) {
    this.currentRoute = route;
    this.currentChannel = channel;
    return true;
  }
}

module('Unit | Component | channel-nav', function (hooks) {
  setupTest(hooks);

  test('switching to next channel', function (assert) {
    const routerService = new RouterStub();
    const channel1 = new Channel({ account: ircAccount, name: 'channel1', visible: false });
    const channel2 = new Channel({ account: ircAccount, name: 'channel2', visible: true });
    const channel3 = new Channel({ account: ircAccount, name: 'channel3', visible: false });
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount ],
      channels: [ channel1, channel2, channel3 ]
    });
    const component = createComponent('component:channel-nav');
    component.coms = comsService;
    component.router = routerService;

    run(() => component.goNextChannel());

    assert.equal(routerService.currentRoute, 'channel');
    assert.equal(routerService.currentChannel.name, channel3.name);

    channel2.visible = false;
    channel3.visible = true;
    run(() => component.goNextChannel());

    assert.equal(routerService.currentChannel.name, channel1.name);
  });

  test('switching to previous channel', function (assert) {
    const routerService = new RouterStub();
    const channel1 = new Channel({ account: ircAccount, name: 'channel1', visible: false });
    const channel2 = new Channel({ account: ircAccount, name: 'channel2', visible: true });
    const channel3 = new Channel({ account: ircAccount, name: 'channel3', visible: false });
    const comsService = this.owner.factoryFor('service:coms').create({
      accounts: [ ircAccount ],
      channels: [ channel1, channel2, channel3 ]
    });
    const component = createComponent('component:channel-nav');
    component.coms = comsService;
    component.router = routerService;

    run(() => component.goPreviousChannel());

    assert.equal(routerService.currentRoute, 'channel');
    assert.equal(routerService.currentChannel.name, channel1.name);

    channel1.visible = true;
    channel2.visible = false;
    run(() => component.goPreviousChannel());

    assert.equal(routerService.currentChannel.name, channel3.name);
  });

});
