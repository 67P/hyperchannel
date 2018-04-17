import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Component | link-to-username', function(hooks) {
  setupTest(hooks);

  test('role returns the IRC role of the user', function(assert) {
    assert.expect(3);

    const component = this.owner.factoryFor('component:link-to-username').create();

    component.set('username', '@smooth_operator');
    assert.equal(component.get('role'), 'op');

    component.set('username', '%wannabe_operator');
    assert.equal(component.get('role'), 'half-op');

    component.set('username', '+frank_sinatra');
    assert.equal(component.get('role'), 'voice');
  });

  test('usernameWithoutPrefix removes IRC role prefixes', function(assert) {
    assert.expect(3);

    const component = this.owner.factoryFor('component:link-to-username').create();

    component.set('username', '@smooth_operator');
    assert.equal(component.get('usernameWithoutPrefix'), 'smooth_operator');

    component.set('username', '%wannabe_operator');
    assert.equal(component.get('usernameWithoutPrefix'), 'wannabe_operator');

    component.set('username', '+frank_sinatra');
    assert.equal(component.get('usernameWithoutPrefix'), 'frank_sinatra');
  });
});

