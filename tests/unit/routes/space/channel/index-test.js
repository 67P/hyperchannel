import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | space/channel/index', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:space/channel/index');
    assert.ok(route);
  });
});
