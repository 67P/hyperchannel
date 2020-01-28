import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Controller | space/channel/index', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function(assert) {
    let controller = this.owner.lookup('controller:space/channel/index');
    assert.ok(controller);
  });
});
