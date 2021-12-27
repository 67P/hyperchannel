import generateMessageId from 'hyperchannel/utils/generate-message-id';
import { module, test } from 'qunit';

module('Unit | Utility | generate message id', function() {
  test('it generates a random message ID string', function(assert) {
    let result = generateMessageId();

    assert.equal(typeof result, 'string', 'returns a string');
    assert.ok(result.match(/^hc-[a-zA-Z0-9]{8}/), 'result matches our expectations')
  });
});
