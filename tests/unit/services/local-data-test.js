import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | local data', function(hooks) {
  setupTest(hooks);

  test('store initialization', function(assert) {
    const service = this.owner.lookup('service:local-data');
    const userSettingsStore = service.stores.userSettings;

    assert.ok(userSettingsStore instanceof Object);
    assert.ok(userSettingsStore.getItem instanceof Function);
  });

  test('default values', async function(assert) {
    const service = this.owner.lookup('service:local-data');
    const userSettingsStore = service.stores.userSettings;
    const currentChannel = await userSettingsStore.getItem('currentChannel');

    assert.equal(currentChannel, 'kosmos');
  });
});
