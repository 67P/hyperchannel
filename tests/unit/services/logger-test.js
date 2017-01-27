import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';

moduleFor('service:logger', 'Unit | Service | logger', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

test('is enabled by default', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.ok(service.get('enabled'));
});

test('does log activeTypes', function(assert) {
  assert.expect(1);

  Ember.Logger.debug = function() {
    assert.ok(true);
  };

  let service = this.subject();
  service.log('error', 'test');
});

test('does log added types', function(assert) {
  assert.expect(1);

  Ember.Logger.debug = function() {
    assert.ok(true);
  };

  let service = this.subject();
  service.add('message');
  service.log('message', 'test');
});

test('does not log if disabled', function(assert) {
  assert.expect(1);

  Ember.Logger.debug = function() {
    assert.ok(false);
  };

  let service = this.subject();
  service.disable();
  assert.ok(!service.get('enabled'));

  service.log('error', 'test');
});

test('does not log if removed types', function(assert) {
  assert.expect(1);

  Ember.Logger.debug = function() {
    assert.ok(false);
  };

  let service = this.subject();
  service.remove('error');
  assert.ok(!service.get('activeTypes').includes('error'));

  service.log('error', 'test');
});
