import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | add-account', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:add-account');
    assert.ok(route);
  });
});
