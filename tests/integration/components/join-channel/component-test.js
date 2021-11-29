import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, select } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { A } from '@ember/array';
import Service from '@ember/service';
import { ircAccount, xmppAccount } from '../../../fixtures/accounts';

class comsStub extends Service {
  accounts = A();
}

module('Integration | Component | join-channel', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
     this.owner.register('service:coms', comsStub);
  });

  test('Account menu for one account', async function(assert) {
    this.coms = this.owner.lookup('service:coms');
    this.coms.accounts.pushObject(ircAccount);
    await render(hbs`<JoinChannel />`);

    assert.equal(this.element.querySelectorAll('select#account option').length, 1, 'select only has one option');
    const el = this.element.querySelector('select#account option');
    assert.equal(el.innerText, ircAccount.id, 'select option is the only account');
    assert.ok(this.element.querySelector('select#account').disabled, 'select is disabled');

  });

  test('Account menu for multiple accounts', async function(assert) {
    this.coms = this.owner.lookup('service:coms');
    this.set('coms.accounts', [ ircAccount, xmppAccount ]);
    await render(hbs`<JoinChannel />`);

    assert.equal(this.element.querySelectorAll('select#account option').length, 2, 'select shows options for all accounts');
    assert.notOk(this.element.querySelector('select#account').disabled, 'select is not disabled');
  });

  test('Select different account', async function(assert) {
    this.coms = this.owner.lookup('service:coms');
    this.set('coms.accounts', [ ircAccount, xmppAccount ]);
    this.set('selectedAccount', ircAccount);
    await render(hbs`<JoinChannel />`);

    select('select#account', xmppAccount.id);
    assert.equal(this.selectedAccount.id, xmppAccount.id, 'updates the selected account property');
  });
});
