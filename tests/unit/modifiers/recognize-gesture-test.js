import { module, test } from 'qunit';
import { setupTest } from 'hyperchannel/tests/helpers';
import RecognizeGestureModifier from 'hyperchannel/modifiers/recognize-gesture';

module('Unit | Modifier | recognize-gesture', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const modifier = new RecognizeGestureModifier({}, () => {});
    assert.ok(modifier);
  });

  test('it creates hammer manager with gestures', function (assert) {
    const element = document.createElement('div');
    const modifier = new RecognizeGestureModifier({}, () => {});

    modifier.modify(element, ['swipeleft', 'swiperight', 'tap'], {
      domEvents: true,
      touchAction: 'auto'
    });

    assert.ok(modifier.manager, 'manager was created');
    assert.strictEqual(modifier.recognizers.length, 3, 'three recognizers added');
  });

  test('it cleans up manager on removal', function (assert) {
    const element = document.createElement('div');
    const modifier = new RecognizeGestureModifier({}, () => {});

    modifier.modify(element, ['tap'], {});
    assert.ok(modifier.manager, 'manager exists');

    modifier.willRemove();
    assert.strictEqual(modifier.manager, null, 'manager was destroyed');
    assert.strictEqual(modifier.recognizers.length, 0, 'recognizers cleared');
  });
});
