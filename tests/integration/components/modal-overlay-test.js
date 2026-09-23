import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render, settled, tab, triggerKeyEvent } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | modal-overlay', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.closed = 0;
    this.onClose = () => {
      this.closed++;
    };
  });

  test('focuses the modal content and tabs to the first button', async function (assert) {
    await render(hbs`
      <ModalOverlay @onClose={{this.onClose}} @label="Accounts">
        <button type="button" class="add">Add</button>
      </ModalOverlay>
    `);

    assert.dom('.hc-modal').isFocused('the modal content receives focus');
    assert
      .dom('.hc-modal')
      .hasAttribute('role', 'dialog')
      .hasAttribute('aria-modal', 'true')
      .hasAttribute('aria-label', 'Accounts');

    await tab();
    assert.dom('.add').isFocused('the first tab stop is the first button');
  });

  test('traps focus inside the modal', async function (assert) {
    await render(hbs`
      <ModalOverlay @onClose={{this.onClose}} @label="Accounts">
        <button type="button" id="add">Add</button>
        <button type="button" id="delete">Delete</button>
      </ModalOverlay>
    `);

    await tab();
    assert.dom('#add').isFocused();

    await tab();
    assert.dom('#delete').isFocused();

    await tab({ backwards: false });
    assert.dom('#add').isFocused('focus wraps from the last to the first');

    await tab({ backwards: true });
    assert.dom('#delete').isFocused('focus wraps from the first to the last');
  });

  test('closes on Escape', async function (assert) {
    await render(hbs`
      <ModalOverlay @onClose={{this.onClose}} @label="Accounts">
        <button type="button">Add</button>
      </ModalOverlay>
    `);

    await triggerKeyEvent('.hc-modal', 'keydown', 'Escape');
    assert.strictEqual(this.closed, 1, 'onClose was called once');
  });

  test('restores focus to the previously focused element on close', async function (assert) {
    this.set('showModal', false);

    await render(hbs`
      <button type="button" id="trigger">Settings</button>
      {{#if this.showModal}}
        <ModalOverlay @onClose={{this.onClose}} @label="Accounts">
          <button type="button" id="add">Add</button>
        </ModalOverlay>
      {{/if}}
    `);

    await click('#trigger');
    assert.dom('#trigger').isFocused();

    this.set('showModal', true);
    await settled();
    assert.dom('.hc-modal').isFocused();

    this.set('showModal', false);
    await settled();
    assert.dom('#trigger').isFocused('focus returns to the trigger');
  });
});
