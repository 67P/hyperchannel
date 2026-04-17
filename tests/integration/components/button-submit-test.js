import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | button-submit', function (hooks) {
  setupRenderingTest(hooks);

  test('button text', async function (assert) {
    await render(hbs`<ButtonSubmit>Connect</ButtonSubmit>`);
    assert.strictEqual(this.element.textContent.trim(), 'Connect');
  });

  test('button loading state without custom text', async function (assert) {
    this.set('isLoading', false);
    await render(hbs`<ButtonSubmit @loading={{this.isLoading}}>Continue</ButtonSubmit>`);
    assert.ok(this.element.textContent.match('Continue'));

    this.set('isLoading', true);
    assert.ok(this.element.textContent.match('Continue'));
  });

  test('button loading state with custom text', async function (assert) {
    this.set('isLoading', false);
    await render(hbs`
      <ButtonSubmit @loading={{this.isLoading}} @textLoading="Connecting">
        Continue
      </ButtonSubmit>
    `);
    assert.strictEqual(this.element.textContent.trim(), 'Continue');

    this.set('isLoading', true);
    assert.ok(this.element.textContent.match('Connecting'));
  });
});
