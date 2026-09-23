import { module, test } from 'qunit';
import relativeChannel from 'hyperchannel/utils/relative-channel';

module('Unit | Utility | relative channel', function () {
  const channel1 = { name: 'channel1' };
  const channel2 = { name: 'channel2' };
  const channel3 = { name: 'channel3' };
  const channels = [channel1, channel2, channel3];

  test('returns the next channel, wrapping at the edge', function (assert) {
    assert.strictEqual(relativeChannel(channels, channel2, 1), channel3);
    assert.strictEqual(relativeChannel(channels, channel3, 1), channel1);
  });

  test('returns the previous channel, wrapping at the edge', function (assert) {
    assert.strictEqual(relativeChannel(channels, channel2, -1), channel1);
    assert.strictEqual(relativeChannel(channels, channel1, -1), channel3);
  });
});
