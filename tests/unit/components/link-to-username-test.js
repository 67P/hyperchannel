import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import createComponent from 'hyperchannel/tests/helpers/create-component';

module('Unit | Component | link-to-username', function(hooks) {
  setupTest(hooks);

  test('role returns the IRC role of the user', function(assert) {
    assert.expect(3);

    const component = createComponent('component:link-to-username');

    component.args.username = '@smooth_operator';
    assert.equal(component.role, 'op');

    component.args.username = '%wannabe_operator';
    assert.equal(component.role, 'half-op');

    component.args.username = '+frank_sinatra';
    assert.equal(component.role, 'voice');
  });

  test('usernameWithoutPrefix removes IRC role prefixes', function(assert) {
    assert.expect(3);

    const component = createComponent('component:link-to-username');

    component.args.username = '@smooth_operator';
    assert.equal(component.usernameWithoutPrefix, 'smooth_operator');

    component.args.username = '%wannabe_operator';
    assert.equal(component.usernameWithoutPrefix, 'wannabe_operator');

    component.args.username = '+frank_sinatra';
    assert.equal(component.usernameWithoutPrefix, 'frank_sinatra');
  });
});

