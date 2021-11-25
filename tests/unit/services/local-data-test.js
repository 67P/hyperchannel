import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | local data', function (hooks) {
  hooks.beforeEach(async function () {
    return new Promise((resolve /*, reject*/) => {
      function nope(e) {
        console.warn('IndexedDB deletion complaint:', e);
        resolve(e);
      }
      const req = window.indexedDB.deleteDatabase('hyperchannel');
      req.onsuccess = resolve;
      req.onerror = (e) => nope(e);
      req.onblocked = (e) => nope(e);
    });
    // FIXME this throws an uncaught IndexedDB error
    // await localforage.dropInstance({ name: 'hyperchannel' });
  });

  setupTest(hooks);

  test('store initialization', function (assert) {
    const service = this.owner.lookup('service:local-data');
    const userSettingsStore = service.stores.userSettings;

    assert.ok(userSettingsStore instanceof Object);
    assert.ok(userSettingsStore.getItem instanceof Function);
  });

  // TODO Re-add when we add new default configs
  // test('default values', async function(assert) {
  //   const service = this.owner.lookup('service:local-data');
  //
  //   await service.setDefaultValues();
  //
  //   const userSettingsStore = service.stores.userSettings;
  //   const currentChannel = await userSettingsStore.getItem('currentChannel');
  //
  //   assert.equal(currentChannel, 'kosmos');
  // });

  test('storing and retrieving values', async function (assert) {
    const service = this.owner.lookup('service:local-data');
    await service.setDefaultValues();
    const userSettingsStore = service.stores.userSettings;

    await userSettingsStore.setItem('currentChannel', 'kosmos-random');
    const currentChannel = await userSettingsStore.getItem('currentChannel');

    assert.equal(currentChannel, 'kosmos-random');
  });
});
