import { module, test } from 'qunit';
import { messageKey, dateHeadlineKey } from 'hyperchannel/utils/message-key';
import Message from 'hyperchannel/models/message';

function chatMessage (props) {
  return new Message({
    type: 'message-chat',
    date: new Date('2024-01-02T03:04:05.678Z'),
    nickname: 'alice',
    content: 'hello world',
    ...props
  });
}

module('Unit | Utility | message key', function () {
  test('uses the id when the message has one', function (assert) {
    const message = chatMessage({ id: 'abc123' });

    assert.strictEqual(messageKey(message), 'abc123');
  });

  test('derives a key from the timestamp and content when there is no id', function (assert) {
    const message = chatMessage();

    const key = messageKey(message);

    assert.ok(key.startsWith('1704164645678-'), `includes the timestamp (${key})`);
    assert.notStrictEqual(key, '1704164645678-', 'includes a content hash');
  });

  test('derives the same key for identical id-less messages', function (assert) {
    assert.strictEqual(messageKey(chatMessage()), messageKey(chatMessage()));
  });

  test('derives different keys for different content', function (assert) {
    const first = messageKey(chatMessage());
    const second = messageKey(chatMessage({ content: 'goodbye world' }));

    assert.notStrictEqual(first, second);
  });

  test('derives different keys for different timestamps', function (assert) {
    const first = messageKey(chatMessage());
    const second = messageKey(chatMessage({ date: new Date('2024-01-02T03:04:06.678Z') }));

    assert.notStrictEqual(first, second);
  });

  test('derives different keys for different authors', function (assert) {
    const first = messageKey(chatMessage());
    const second = messageKey(chatMessage({ nickname: 'bob' }));

    assert.notStrictEqual(first, second);
  });

  test('date headlines get a date- prefixed key', function (assert) {
    const date = new Date('2024-01-02T00:00:00.000Z');

    assert.strictEqual(dateHeadlineKey(date), `date-${date.getTime()}`);
  });
});
