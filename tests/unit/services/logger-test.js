import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | logger', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let service = this.owner.lookup('service:logger');
    assert.ok(service);
  });

  test('is enabled by default', function (assert) {
    assert.expect(1);

    let service = this.owner.lookup('service:logger');
    assert.ok(service.enabled);
  });

  test('does log activeTypes', function (assert) {
    assert.expect(2);

    const originalDebug = console.debug;
    console.debug = function () {
      assert.equal(arguments[0], '[error]');
      assert.ok(true);
      console.debug = originalDebug;
    };

    let service = this.owner.lookup('service:logger');
    service.log('error', 'test');
  });

  test('does log added types', function (assert) {
    assert.expect(1);

    const originalDebug = console.debug;
    console.debug = function () {
      assert.ok(true);
      console.debug = originalDebug;
    };

    let service = this.owner.lookup('service:logger');
    service.add('message');
    service.log('message', 'test');
  });

  test('does not log if disabled', function (assert) {
    assert.expect(1);

    const originalDebug = console.debug;
    console.debug = function () {
      assert.ok(false);
    };

    let service = this.owner.lookup('service:logger');
    service.disable();
    assert.ok(!service.enabled);

    service.log('error', 'test');
    console.debug = originalDebug;
  });

  test('does not log if removed types', function (assert) {
    assert.expect(1);

    const originalDebug = console.debug;
    console.debug = function () {
      assert.ok(false);
    };

    let service = this.owner.lookup('service:logger');
    service.remove('error');
    assert.ok(!service.activeTypes.includes('error'));

    service.log('error', 'test');
    console.debug = originalDebug;
  });
});
