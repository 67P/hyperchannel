import domainFromId from 'hyperchannel/utils/domain-from-id';
import { module, test } from 'qunit';

module('Unit | Utility | domain from id', function () {
  test('it returns the part after the final @', function (assert) {
    assert.strictEqual(domainFromId('#kosmos-dev@irc.libera.chat'), 'irc.libera.chat', 'IRC channel');
    assert.strictEqual(domainFromId('##kosmos-dev@irc.libera.chat'), 'irc.libera.chat', 'multi-hash IRC channel');
    assert.strictEqual(domainFromId('nick@irc.libera.chat'), 'irc.libera.chat', 'IRC person');
    assert.strictEqual(domainFromId('kosmos-dev@kosmos.chat'), 'kosmos.chat', 'XMPP MUC room');
  });

  test('it preserves @ characters that are part of the local part', function (assert) {
    assert.strictEqual(domainFromId('#foo@bar@irc.libera.chat'), 'irc.libera.chat', 'IRC channel with @');
    assert.strictEqual(domainFromId('foo@bar@irc.libera.chat'), 'irc.libera.chat', 'IRC person with @');
  });

  test('it ignores an XMPP resource suffix', function (assert) {
    assert.strictEqual(domainFromId('kosmos-dev@kosmos.chat/jimmy'), 'kosmos.chat', 'XMPP user channel');
  });

  test('it returns undefined when there is no @', function (assert) {
    assert.strictEqual(domainFromId('kosmos-dev'), undefined, 'bare name');
    assert.strictEqual(domainFromId(''), undefined, 'empty string');
    assert.strictEqual(domainFromId(undefined), undefined, 'undefined');
  });
});