import {
  moduleForComponent,
  test
} from 'ember-qunit';

moduleForComponent('link-to-username', {
  // Specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
  unit: true
});

test('role returns the IRC role of the user', function(assert) {
  assert.expect(3);

  const component = this.subject();

  component.set('username', '@smooth_operator');
  assert.equal(component.get('role'), 'op');

  component.set('username', '%wannabe_operator');
  assert.equal(component.get('role'), 'half-op');

  component.set('username', '+frank_sinatra');
  assert.equal(component.get('role'), 'voice');
});

test('usernameWithoutPrefix removes IRC role prefixes', function(assert) {
  assert.expect(3);

  const component = this.subject();

  component.set('username', '@smooth_operator');
  assert.equal(component.get('usernameWithoutPrefix'), 'smooth_operator');

  component.set('username', '%wannabe_operator');
  assert.equal(component.get('usernameWithoutPrefix'), 'wannabe_operator');

  component.set('username', '+frank_sinatra');
  assert.equal(component.get('usernameWithoutPrefix'), 'frank_sinatra');
});

