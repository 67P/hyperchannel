import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, fillIn, render, select } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { A } from '@ember/array';
import Service from '@ember/service';
import { ircAccount, xmppAccount } from '../../../fixtures/accounts';

class comsStub extends Service {
  accounts = A();
}

module('Integration | Component | join-channel', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:coms', comsStub);
  });

  test('Account menu for one account', async function (assert) {
    this.coms = this.owner.lookup('service:coms');
    this.coms.accounts.pushObject(ircAccount);
    await render(hbs`<JoinChannel />`);

    assert.equal(
      this.element.querySelectorAll('select#account option').length,
      1,
      'only has one option'
    );
    const el = this.element.querySelector('select#account option');
    assert.equal(
      el.innerText,
      ircAccount.id,
      'renders the only account option'
    );
    assert.ok(
      this.element.querySelector('select#account').disabled,
      'is disabled'
    );
  });

  test('Account menu for multiple accounts', async function (assert) {
    this.coms = this.owner.lookup('service:coms');
    this.set('coms.accounts', [ircAccount, xmppAccount]);
    await render(hbs`<JoinChannel />`);

    assert.equal(
      this.element.querySelectorAll('select#account option').length,
      2,
      'renders options for all accounts'
    );
    assert.notOk(
      this.element.querySelector('select#account').disabled,
      'is not disabled'
    );
  });

  test('Select different account', async function (assert) {
    assert.expect(2);

    const coms = this.owner.lookup('service:coms');

    coms.accounts = [ircAccount, xmppAccount];

    const router = this.owner.lookup('service:router');
    router.transitionTo = function () {};

    coms.createChannel = function (account, channelName) {
      assert.equal(account.id, xmppAccount.id, 'uses the selected account');
      assert.equal(
        channelName,
        'kosmos-random@kosmos.chat',
        'uses the given channel address'
      );
    };

    this.set('close', function () {});

    await render(hbs`<JoinChannel @close={{this.close}} />`);

    await select('select#account', xmppAccount.id);
    await fillIn('input[name="channel-name"]', 'kosmos-random');

    await click('input[type="submit"]');
  });
});
