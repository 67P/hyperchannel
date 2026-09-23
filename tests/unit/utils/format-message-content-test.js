import { module, test } from 'qunit';
import formatMessageContent from 'hyperchannel/utils/format-message-content';

module('Unit | Utility | format message content', function () {
  test('turns full URLs into links', function (assert) {
    assert.strictEqual(
      formatMessageContent('visit https://kosmos.org for more info').toString(),
      'visit <a href="https://kosmos.org" rel="nofollow noopener" target="_blank">https://kosmos.org</a> for more info',
    );
  });

  test('does not turn domain names into links', function (assert) {
    assert.strictEqual(
      formatMessageContent('visit kosmos.org for more info').toString(),
      'visit kosmos.org for more info',
    );
  });

  test('does not turn emails into links', function (assert) {
    assert.strictEqual(
      formatMessageContent('hey team@kosmos.org').toString(),
      'hey team@kosmos.org',
    );
  });

  test('escapes HTML', function (assert) {
    assert.strictEqual(
      formatMessageContent('never gonna <marquee>give you up</marquee>').toString(),
      'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;',
    );
  });

  test('converts color codes', function (assert) {
    const content = 'put some \u000313color\u000f and \u0002bold\u000f into your life. Or \u000305\u0002both\u000f';
    assert.strictEqual(
      formatMessageContent(content).toString(),
      'put some <span class="color-13">color</span> and <span class="bold">bold</span> into your life. Or <span class="color-05"><span class="bold">both</span>',
    );
  });

  test('renders images from image URLs', function (assert) {
    const content = formatMessageContent(
      'https://storage.5apps.com/basti/public/shares/160527-1119-magic.gif',
    ).toString();
    assert.ok(content.match('<a href="https://storage.5apps.com/basti/public/shares/160527-1119-magic.gif" target="_blank" rel="nofollow noopener">'));
    assert.ok(content.match('<img src="https://storage.5apps.com/basti/public/shares/160527-1119-magic.gif"'));
  });
});
