import { module, test } from 'qunit';
import userColor from 'hyperchannel/utils/user-color';

module('Unit | Utility | user color', function () {
  test('generates a consistent color for an identifier', function (assert) {
    assert.strictEqual(userColor('the_plague'), 'rgb(163, 108, 0)');
    assert.strictEqual(userColor('alice'), 'rgb(148, 114, 0)');
    assert.strictEqual(userColor('kosmos'), 'rgb(116, 125, 0)');
    assert.strictEqual(userColor('mrklaus'), 'rgb(72, 104, 255)');
  });

  test('generates the same color for the same identifier', function (assert) {
    assert.strictEqual(userColor('alice'), userColor('alice'));
  });

  test('generates a color for an empty identifier', function (assert) {
    assert.strictEqual(userColor(''), 'rgb(128, 122, 0)');
  });
});
