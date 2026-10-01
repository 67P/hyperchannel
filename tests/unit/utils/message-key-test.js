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
  test('scopes a transport id by author', function (assert) {
    const message = chatMessage({ id: 'abc123' });

    assert.strictEqual(messageKey(message), JSON.stringify(['alice', 'abc123']));
  });

  test('produces CSS-selector-safe keys', function (assert) {
    // Keys are used as `data-message-key` values and matched with a selector
    // built via `CSS.escape`, which rewrites U+0000 to U+FFFD. A key containing
    // NUL would therefore never be found, silently breaking anchor restoration.
    const messages = [
      chatMessage({ id: 'abc123' }),
      chatMessage({ id: 'has "quote" and \\backslash' }),
      chatMessage(),
      chatMessage({ id: 'abc123', sid: 'stanza-9' }),
    ];

    for (const message of messages) {
      const key = messageKey(message);
      assert.notOk(key.includes('\u0000'), `"${key}" contains no NUL`);
    }
  });

  test('uses a server stanza id as-is', function (assert) {
    const message = chatMessage({ id: 'abc123', sid: 'stanza-9' });

    assert.strictEqual(messageKey(message), 'sid:stanza-9');
  });

  test('does not collapse the same id sent by different authors', function (assert) {
    const alice = chatMessage({ id: 'shared' });
    const bob = chatMessage({ nickname: 'bob', id: 'shared' });

    assert.notStrictEqual(messageKey(alice), messageKey(bob));
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
