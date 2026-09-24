import { module, test } from 'qunit';
import { ircRole, stripIrcRolePrefix } from 'hyperchannel/utils/irc-username';

module('Unit | Utility | irc username', function () {
  test('ircRole returns the IRC role of the user', function (assert) {
    assert.strictEqual(ircRole('@smooth_operator'), 'op');
    assert.strictEqual(ircRole('%wannabe_operator'), 'half-op');
    assert.strictEqual(ircRole('+frank_sinatra'), 'voice');
    assert.strictEqual(ircRole('regular_user'), 'normal');
    assert.strictEqual(ircRole(''), 'normal');
    assert.strictEqual(ircRole(undefined), 'normal');
  });

  test('stripIrcRolePrefix removes IRC role prefixes', function (assert) {
    assert.strictEqual(stripIrcRolePrefix('@smooth_operator'), 'smooth_operator');
    assert.strictEqual(stripIrcRolePrefix('%wannabe_operator'), 'wannabe_operator');
    assert.strictEqual(stripIrcRolePrefix('+frank_sinatra'), 'frank_sinatra');
    assert.strictEqual(stripIrcRolePrefix('regular_user'), 'regular_user');
    assert.strictEqual(stripIrcRolePrefix(''), null);
    assert.strictEqual(stripIrcRolePrefix(undefined), null);
  });
});
