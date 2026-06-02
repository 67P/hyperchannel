import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Controller | channel/settings', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const controller = this.owner.lookup('controller:channel/settings');
    assert.ok(controller);
  });
});
